# Generative City Wallet

Generative City Wallet is a privacy-first local commerce product built for the DSV Generative City-Wallet challenge. It detects user intent on-device, generates context-aware local offers in real time, and closes the loop with simulated redemption plus merchant analytics.

## What This Submission Demonstrates

- Real-time context sensing (weather, time/location, demand proxies)
- Dynamic offer generation (not static coupon retrieval)
- End-to-end flow (intent -> offer -> decision -> redemption)
- Consumer and merchant experiences
- Privacy-by-design architecture (raw behavior stays local; abstract intent goes upstream)

## Architecture Overview

- `apps/web`: React + Vite mobile-first product UI (consumer and merchant journeys)
- `apps/api`: Node API orchestrator, offer pipeline, redemption lifecycle, merchant endpoints
- `packages/intent-engine`: on-device intent inference runtime and fallback policy
- `infra`: schema and infrastructure assets

Runtime policy for intent:
- Preferred: embedded ONNX (`INTENT_MODEL_PROVIDER=onnx`)
- Fallback: local small model (Ollama)
- Final fallback: deterministic classifier with same output contract

## Repository Structure

- `apps/web`
- `apps/api`
- `packages/intent-engine`
- `infra`
- `docs`
- `message-review`
- `json-formats`

## Quick Start (Local)

1. Copy env templates:
   - Root: copy `.env.example` to `.env.local`
   - API: copy `apps/api/.env.example` to `apps/api/.env`
2. Fill required backend env vars:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
3. Start services from repo root:

```bash
npm --prefix apps/api run start
npm --prefix apps/web run dev
```

Default local API base URL is `http://127.0.0.1:8080` (also used by web when `VITE_API_BASE_URL` is unset).

## Key Environment Variables

- Generative offer path:
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_SERVER_LARGE_MODEL`
  - `OPENROUTER_OFFER_MODEL`
- On-device intent path:
  - `INTENT_MODEL_PROVIDER` (`onnx`, `ollama`, `local`, `embedded`, `edge`)
  - `INTENT_ONNX_MODEL_PATH`
  - `OLLAMA_BASE_URL`
  - `OLLAMA_INTENT_MODEL`
- Voice agent:
  - `ELEVENLABS_API_KEY`
  - `ELEVENLABS_AGENT_ID`
  - `ELEVENLABS_BASE_URL` (optional)
- Security hardening:
  - `INTERNAL_API_KEY` (recommended for deployed environments using `/internal/*`)
- Frontend:
  - `VITE_API_BASE_URL` (required for hosted web deployments)

## Verification Commands

```bash
# Frontend
npm --prefix apps/web run test
npm --prefix apps/web run build

# API smoke
npm --prefix apps/api run smoke:e2e
npm --prefix apps/api run smoke:tavily

# Full E2E validation
node apps/api/scripts/e2e-full-models.js

# Intent engine tests
node --test packages/intent-engine/brain/__tests__/*.test.js
```

## Canonical API Flow

1. `POST /v1/intent-signal`
2. `POST /v1/offer/generate`
3. `GET /v1/offers/active`
4. `POST /v1/offers/:id/decision`
5. `POST /v1/redemption/create-token`
6. `POST /v1/redemption/validate`
7. Merchant dashboard endpoints for aggregate outcomes

## Deployment Notes

- Web deploy target: `apps/web` (Vercel-friendly)
- Set `VITE_API_BASE_URL` to your public API
- Keep `/internal/*` protected in production with `INTERNAL_API_KEY`

## Submission Documents

- DSV judge checklist and runbook: `JUDGING.md`
- QA verification and evidence checklist: `SUBMISSION_QA_REPORT.md`
- Deep architecture and roadmap: `Roadmap.md`
- Setup and model runtime notes: `setup.md`
- API module details: `apps/api/README.md`
- Web app details: `apps/web/README.md`