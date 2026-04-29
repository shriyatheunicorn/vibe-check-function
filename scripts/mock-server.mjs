import http from "node:http";

const port = Number(process.env.PORT || 14113);

function json(res, status, body) {
  res.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-bb-api-key",
    "content-type": "application/json"
  });
  res.end(JSON.stringify(body));
}

function buildReport(url) {
  return {
    url,
    title: "Mocked live site",
    verdict: "Stylish and memorable, with enough clarity to keep a curious visitor moving.",
    audience: {
      label: "Founders, product teams, and marketers who want a fast read on first impressions",
      confidence: 86
    },
    personality: {
      label: "Confident creative operator",
      feelsLike: "A polished product experience with a little editorial attitude.",
      risk: "The emotional read is strong, but the real Browserbase function is needed for page-specific evidence."
    },
    scores: {
      clarity: 78,
      trust: 82,
      energy: 88,
      polish: 91,
      memorability: 80,
      conversionConfidence: 76
    },
    signals: [
      {
        label: "Local backend connected",
        tone: "trust",
        detail: "The frontend is calling the function-shaped endpoint at localhost:14113."
      },
      {
        label: "Browserbase credentials missing",
        tone: "unclear",
        detail: "Add BROWSERBASE_PROJECT_ID and BROWSERBASE_API_KEY to run the real browser agent."
      },
      {
        label: "Demo visuals are ready",
        tone: "delight",
        detail: "Radar, annotations, storyboard, personality, and signal cards all render from backend data."
      }
    ],
    storyboard: [
      { time: "0s", observation: "The URL is submitted from the frontend form." },
      { time: "8s", observation: "The local backend returns a structured report in the Browserbase invocation shape." },
      { time: "19s", observation: "The dashboard updates from API data rather than static page state." },
      { time: "34s", observation: "Swap to the real Function server once Browserbase credentials are present." }
    ],
    annotations: [
      { x: 8, y: 12, width: 46, height: 18, tone: "trust", note: "Connected endpoint." },
      { x: 62, y: 13, width: 24, height: 11, tone: "delight", note: "Live UI update." },
      { x: 14, y: 62, width: 70, height: 16, tone: "unclear", note: "Needs real credentials." }
    ]
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  if (req.method !== "POST" || req.url !== "/v1/functions/vibe-check/invoke") {
    json(res, 404, { error: "Not found" });
    return;
  }

  let raw = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    raw += chunk;
  });
  req.on("end", () => {
    try {
      const body = raw ? JSON.parse(raw) : {};
      const url = body?.params?.url || "https://example.com";
      json(res, 200, buildReport(url));
    } catch (error) {
      json(res, 400, { error: error instanceof Error ? error.message : "Invalid JSON" });
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock Vibe Check backend listening on http://127.0.0.1:${port}/v1/functions/vibe-check/invoke`);
});
