# Team-Worldwide-HackNation2026

## Local Environment Setup

Use two env files for local development:

1. Copy root `.env.example` to root `.env.local` for client/demo scripts.
2. Copy `server/.env.example` to `server/.env` for backend runtime.
3. Set `OPENROUTER_API_KEY` in both files if you run both stacks locally.
4. Keep secret files local only. Never commit `.env`, `.env.local`, or any real API key.

Current model in use:

- Offer generation: `nvidia/nemotron-3-super:free`

## Client-Side LLM Setup (OpenRouter)

Starter files were added:

- `client/llm/openrouter-client.js`
- `client/llm/offer-generator.js`
- `client/llm/example-usage.js`

Environment variables used for offer model (in priority order):

1. `OPENROUTER_OFFER_MODEL`
2. `OPENROUTEROFFERMODEL` (legacy alias)

Run locally:

```bash
node client/llm/example-usage.js
```

This script is an optional direct LLM utility path. For judged end-to-end flow, use the backend canonical path in the next sections.

This setup expects:

- `OPENROUTER_API_KEY` (Node/local direct mode)
- `OPENROUTER_PROXY_BASE_URL` + `OPENROUTER_PROXY_SESSION_TOKEN` (recommended production mode)
- `OPENROUTEROFFERMODEL=nvidia/nemotron-3-super:free` (or `OPENROUTER_OFFER_MODEL`)
- `OPENROUTER_HTTP_REFERER` (defaults to `https://localhost`)
- `OPENROUTER_APP_TITLE` (defaults to `Generative City Wallet`)

Important: browser calls now block direct API-key usage by default. Use backend proxy mode (`OPENROUTER_PROXY_BASE_URL` + session token) in production.

## Local OpenRouter Proxy

Use the included proxy route when running browser/client code that must not expose API keys.

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

## Canonical Path vs Optional Utilities

Canonical demo/runtime path (recommended for challenge):

- Client brain sends intent to backend: `POST /v1/intent-signal`
- Client brain requests generation from backend: `POST /v1/offer/generate`
- Client fetches feed from backend: `GET /v1/offers/active`
- Client redemption flow uses backend redemption endpoints
- Merchant dashboard reads backend dashboard endpoints

Canonical backend runtime env source:

- `server/.env` (preferred; loaded first by `server/src/config.js` for `node server/src/index.js`)
- Root `.env` is a backward-compatible fallback only.

Optional utility path:

- `server/openrouter-proxy.js` (`/v1/offer/openrouter`) is a direct OpenRouter relay utility for browser-safe key handling.
- It is not the canonical project orchestration endpoint for end-to-end judged flow.

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

Recommended local run order for canonical challenge flow:

1. Start backend: `node server/src/index.js`
2. Run brain example against backend: `node client/brain/example-usage.js`
3. Optionally run smoke flow: `npm --prefix server run smoke:e2e`

Brain example environment:

- `BRAIN_PROXY_BASE_URL=http://localhost:8080` (canonical backend API)
- `BRAIN_PROXY_AUTH_TOKEN` optional (used only if your gateway enforces bearer auth)

Run tests:

```bash
node --test client/brain/__tests__/*.test.js
```

Production architecture expectation:

- Client performs privacy-sensitive inference and policy locally.
- Client sends only abstract `intent_packet` + locality limiter to backend/edge proxy.
- Proxy performs Nemotron generation + schema/policy validation before returning offers.