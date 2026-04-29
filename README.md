# Vibe Check Function

A Browserbase Function that visits a website and returns a structured "vibe report": clarity, trust, energy, polish, memorability, conversion confidence, audience guess, storyboard moments, screenshot annotations, and an optional page screenshot.

This repo is the browser automation layer. The visual demo lives in the companion frontend repo: [`vibe-check-web`](https://github.com/shriyatheunicorn/vibe-check-web).

## What this template does

Vibe Check is a first-impression website auditor. Given a URL, it opens the site in a managed Browserbase session, reads visible page content, counts likely calls to action, captures a screenshot, and converts those observations into a report that a frontend can render.

It is designed for demos where the output needs to feel more interesting than a generic scrape:

- The report includes emotional/product perception signals.
- Scores are grouped around buyer-facing qualities.
- The output contains enough structure for charts, cards, overlays, and timelines.
- The frontend can display a real screenshot when the browser capture succeeds.

## Architecture

The Function is registered with Browserbase's Functions SDK:

```ts
defineFn("vibe-check", async (context, params) => {
  // connect to the Browserbase session
  // visit the submitted URL
  // extract page signals
  // return a VibeReport
});
```

At runtime, Browserbase provides a managed browser session in `context.session.connectUrl`. The Function connects to that session with Playwright over CDP:

```ts
const browser = await chromium.connectOverCDP(context.session.connectUrl);
```

From there, the Function:

1. Navigates to the submitted URL.
2. Reads the page title and visible body text.
3. Counts likely CTA elements such as "Start", "Try", "Book", "Demo", and "Contact".
4. Captures an above-the-fold PNG screenshot.
5. Runs lightweight heuristics over the text to score the page.
6. Returns a typed `VibeReport`.

## Report schema

The frontend expects this shape:

```ts
type VibeReport = {
  url: string;
  title: string;
  verdict: string;
  audience: {
    label: string;
    confidence: number;
  };
  personality: {
    label: string;
    feelsLike: string;
    risk: string;
  };
  scores: {
    clarity: number;
    trust: number;
    energy: number;
    polish: number;
    memorability: number;
    conversionConfidence: number;
  };
  signals: Array<{
    label: string;
    tone: "trust" | "friction" | "delight" | "unclear";
    detail: string;
  }>;
  storyboard: Array<{
    time: string;
    observation: string;
  }>;
  annotations: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    tone: "trust" | "friction" | "delight" | "unclear";
    note: string;
  }>;
  screenshot?: string;
};
```

`annotations` use percentage-based coordinates, which makes them easy for the frontend to place over screenshots responsively.

## Run locally

Install dependencies:

```bash
pnpm install
```

Create `.env`:

```bash
cp .env.example .env
```

Fill in:

```bash
BROWSERBASE_PROJECT_ID=your_project_id
BROWSERBASE_API_KEY=your_api_key
```

Start the real Browserbase Function dev server:

```bash
pnpm dev
```

Invoke it:

```bash
curl -X POST http://127.0.0.1:14113/v1/functions/vibe-check/invoke \
  -H "Content-Type: application/json" \
  -d '{"params": {"url": "https://example.com"}}'
```

## Run without Browserbase credentials

For frontend demos, this repo also includes a local mock server with the same invoke path:

```bash
pnpm dev:mock
```

It listens on:

```txt
http://127.0.0.1:14113/v1/functions/vibe-check/invoke
```

Use this when you want to demo the UI without consuming Browserbase sessions.

## Deploy

Publish the Function:

```bash
pnpm publish
```

Then call the deployed Function ID:

```bash
curl --request POST \
  --url https://api.browserbase.com/v1/functions/YOUR_FUNCTION_ID/invoke \
  --header "Content-Type: application/json" \
  --header "x-bb-api-key: YOUR_API_KEY" \
  --data '{"params": {"url": "https://example.com"}}'
```

Use the deployed URL as `VITE_VIBE_CHECK_API_URL` in the frontend repo.

## Customize it

Useful places to edit:

- `src/index.ts`: browser session flow, extraction logic, scoring heuristics, and returned report.
- `src/report.ts`: shared report types.
- `scripts/mock-server.mjs`: local mock response for frontend-only demos.

Good extensions:

- Replace the lightweight scoring heuristics with an LLM classification step.
- Add multi-page crawling for pricing, docs, or signup flows.
- Return more precise DOM coordinates for screenshot annotations.
- Store historical reports and compare how a site changes over time.
