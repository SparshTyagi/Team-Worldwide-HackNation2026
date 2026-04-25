# Team-Worldwide-HackNation2026

## Local Environment Setup

1. Copy `.env.example` to `.env.local` (or `.env` if that is your local convention).
2. Set `OPENROUTER_API_KEY` to your active OpenRouter key.
3. Keep secret files local only. Never commit `.env`, `.env.local`, or any real API key.

Current model mapping:

- Offer generation: `nvidia/nemotron-3-super:free`
- Merchant analytics: `deepseek/deepseek-r1:free`
- Intent prototyping: `google/gemma-3-4b:free`

## Client-Side LLM Setup (OpenRouter)

Starter files were added:

- `client/llm/openrouter-client.js`
- `client/llm/offer-generator.js`
- `client/llm/example-usage.js`

Environment variables used for offer model (in priority order):

1. `OPENROUTEROFFERMODEL`
2. `OPENROUTER_OFFER_MODEL`

Run locally:

```bash
node client/llm/example-usage.js
```

This setup expects:

- `OPENROUTER_API_KEY` (Node/local direct mode)
- `OPENROUTER_PROXY_BASE_URL` + `OPENROUTER_PROXY_SESSION_TOKEN` (recommended production mode)
- `OPENROUTEROFFERMODEL=nvidia/nemotron-3-super:free` (or `OPENROUTER_OFFER_MODEL`)
- `OPENROUTER_HTTP_REFERER` (defaults to `https://localhost`)
- `OPENROUTER_APP_TITLE` (defaults to `Generative City Wallet`)

Important: browser calls now block direct API-key usage by default. Use backend proxy mode (`OPENROUTER_PROXY_BASE_URL` + session token) in production.

## Local OpenRouter Proxy

Use the included proxy route when running browser/client code:

- Endpoint: `POST /v1/offer/openrouter`
- Health check: `GET /health`
- File: `server/openrouter-proxy.js`

Environment:

- `OPENROUTER_API_KEY` (required by proxy)
- `OPENROUTER_PROXY_PORT` (default `8787`)
- `OPENROUTER_PROXY_SESSION_TOKEN` (recommended; enables bearer-token session check)
- `OPENROUTER_HTTP_REFERER` and `OPENROUTER_APP_TITLE` (optional OpenRouter metadata headers)

Start the proxy:

```bash
node server/openrouter-proxy.js
```

Then point client env to:

- `OPENROUTER_PROXY_BASE_URL=http://localhost:8787`
- `OPENROUTER_PROXY_SESSION_TOKEN=<same token as proxy>`

## React Native Client Brain (Roadmap-Aligned Hybrid)

Implemented brain modules:

- `client/brain/contracts/` - strict runtime validators + TypeScript type definitions
- `client/brain/context/` - context collection and locality limiter generation
- `client/brain/policy/` - consent gating and runtime channel controls
- `client/brain/intent/` - deterministic intent classifier with confidence/fatigue fallback
- `client/brain/orchestration/` - proxy integration, retries, fallback offers, and end-to-end brain flow
- `client/brain/observability/` - local metrics recorder (latency/fallback/confidence)
- `client/brain/storage/` - secure store adapter (replaceable with RN MMKV/Keychain)

Run end-to-end brain example:

```bash
node client/brain/example-usage.js
```

Run tests:

```bash
node --test client/brain/__tests__/*.test.js
```

Production architecture expectation:

- Client performs privacy-sensitive inference and policy locally.
- Client sends only abstract `intent_packet` + locality limiter to backend/edge proxy.
- Proxy performs Nemotron generation + schema/policy validation before returning offers.