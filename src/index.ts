import { defineFn } from "@browserbasehq/sdk-functions";
import { chromium } from "playwright-core";
import { z } from "zod";
import type { VibeReport } from "./report.js";

const Params = z.object({
  url: z.string().url()
});

const score = (value: number) => Math.max(1, Math.min(100, Math.round(value)));

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function buildReport(input: {
  url: string;
  title: string;
  bodyText: string;
  ctaCount: number;
  screenshot?: string;
}): VibeReport {
  const text = input.bodyText.toLowerCase();
  const hasPricing = includesAny(text, ["pricing", "plans", "free trial", "book a demo"]);
  const hasProof = includesAny(text, ["trusted by", "customers", "case study", "soc 2", "security"]);
  const hasProduct = includesAny(text, ["dashboard", "workflow", "automation", "platform", "api"]);
  const hasVagueWords = includesAny(text, ["revolutionize", "seamless", "unlock", "supercharge"]);
  const hasHumanTone = includesAny(text, ["teams", "founders", "developers", "designers", "operators"]);

  const clarity = score(58 + (hasProduct ? 14 : 0) + (hasPricing ? 8 : 0) - (hasVagueWords ? 10 : 0));
  const trust = score(52 + (hasProof ? 20 : 0) + (hasPricing ? 7 : 0));
  const energy = score(55 + Math.min(input.ctaCount, 4) * 6 + (hasHumanTone ? 8 : 0));
  const polish = score(68 + (input.title ? 8 : 0) + (hasProof ? 5 : 0));
  const memorability = score(48 + (hasHumanTone ? 12 : 0) - (hasVagueWords ? 8 : 0));
  const conversionConfidence = score((clarity + trust + energy) / 3);

  const audienceLabel = hasHumanTone
    ? "Product-minded teams who care about speed and credibility"
    : "Busy evaluators trying to understand the offer quickly";

  const verdict =
    clarity > 75 && trust > 75
      ? "Clear, credible, and ready for a serious buyer."
      : clarity < 60
        ? "Visually competent, but it takes too long to say what the product actually does."
        : "Promising and polished, with a few trust and specificity gaps to close.";

  return {
    url: input.url,
    title: input.title || "Untitled page",
    verdict,
    audience: {
      label: audienceLabel,
      confidence: score(62 + (hasHumanTone ? 18 : 0) + (hasProduct ? 8 : 0))
    },
    personality: {
      label: trust > energy ? "Composed operator" : "High-energy builder",
      feelsLike: hasProof
        ? "A serious product that knows buyers need evidence."
        : "A confident pitch that could use more proof moments.",
      risk: hasVagueWords
        ? "Abstract language may blur the product before the visitor understands it."
        : "The page may still need a sharper reason to remember it tomorrow."
    },
    scores: {
      clarity,
      trust,
      energy,
      polish,
      memorability,
      conversionConfidence
    },
    signals: [
      {
        label: hasPricing ? "Commercial intent is visible" : "Pricing path is hidden",
        tone: hasPricing ? "trust" : "unclear",
        detail: hasPricing ? "Visitors can orient around cost or buying motion." : "A buyer may need to hunt for the next practical step."
      },
      {
        label: hasProof ? "Trust proof detected" : "Proof could be stronger",
        tone: hasProof ? "trust" : "friction",
        detail: hasProof ? "The page includes credibility markers." : "Add customer, security, or outcome evidence earlier."
      },
      {
        label: input.ctaCount > 0 ? "Action path exists" : "No obvious CTA",
        tone: input.ctaCount > 0 ? "delight" : "friction",
        detail: input.ctaCount > 0 ? `${input.ctaCount} likely call-to-action element(s) found.` : "The first visit needs a clearer next step."
      }
    ],
    storyboard: [
      { time: "0s", observation: input.title ? `Page announces itself as "${input.title}".` : "The first impression lacks a strong title signal." },
      { time: "8s", observation: hasProduct ? "Product language appears early enough to classify the offer." : "The offer remains a little abstract after the first scan." },
      { time: "19s", observation: hasProof ? "Credibility rises once proof language appears." : "Trust stays mostly dependent on visual polish." },
      { time: "34s", observation: hasPricing ? "Buying intent has a visible path." : "Conversion confidence drops because pricing or demo intent is not obvious." }
    ],
    annotations: [
      {
        x: 8,
        y: 10,
        width: 52,
        height: 18,
        tone: clarity > 65 ? "trust" : "unclear",
        note: clarity > 65 ? "The hero explains enough to keep scanning." : "The hero needs a sharper product sentence."
      },
      {
        x: 62,
        y: 12,
        width: 28,
        height: 14,
        tone: input.ctaCount > 0 ? "delight" : "friction",
        note: input.ctaCount > 0 ? "CTA path detected." : "CTA is not obvious above the fold."
      }
    ],
    screenshot: input.screenshot
  };
}

defineFn(
  "vibe-check",
  async (context, params) => {
    const { url } = params;
    const browser = await chromium.connectOverCDP(context.session.connectUrl);

    try {
      const page = browser.contexts()[0]?.pages()[0] ?? (await browser.newPage());

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1500);

      const title = await page.title();
      const bodyText = await page.locator("body").innerText({ timeout: 10000 }).catch(() => "");
      const ctaCount = await page
        .locator('a, button, input[type="submit"]')
        .evaluateAll((nodes) =>
          nodes.filter((node) => {
            const text = (node.textContent || node.getAttribute("value") || "").toLowerCase();
            return /start|try|get|book|demo|contact|buy|sign|join|download/.test(text);
          }).length
        )
        .catch(() => 0);

      const screenshotBuffer = await page.screenshot({ fullPage: false, type: "png" }).catch(() => undefined);
      const screenshot = screenshotBuffer ? `data:image/png;base64,${screenshotBuffer.toString("base64")}` : undefined;

      return buildReport({ url, title, bodyText, ctaCount, screenshot });
    } finally {
      await browser.close();
    }
  },
  {
    parametersSchema: Params
  }
);
