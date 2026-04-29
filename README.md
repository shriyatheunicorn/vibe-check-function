# Vibe Check Function

A Browserbase Function that visits a website and returns a structured "vibe report": clarity, trust, energy, polish, memorability, conversion confidence, audience guess, storyboard moments, and screenshot annotation hints.

## Run locally

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Invoke the local function:

```bash
curl -X POST http://127.0.0.1:14113/v1/functions/vibe-check/invoke \
  -H "Content-Type: application/json" \
  -d '{"params": {"url": "https://example.com"}}'
```

## Deploy

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

Use the resulting endpoint as `VITE_VIBE_CHECK_API_URL` in the frontend repo.
