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

- `OPENROUTER_API_KEY`
- `OPENROUTEROFFERMODEL=nvidia/nemotron-3-super:free` (or `OPENROUTER_OFFER_MODEL`)

Important: client-side API keys are exposed in browsers. For production, proxy LLM calls through your backend.

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