# Team-Worldwide-HackNation2026

Generative City Wallet is a privacy-first local commerce assistant. It detects user intent on device, generates dynamic offers from live context, and closes the loop with redemption plus merchant analytics.

## Repository Structure

The repo was reorganized into app/package boundaries to separate runtime surfaces from shared logic.

- `apps/web` - React/Vite user experience.
- `apps/api` - backend APIs, orchestration, validation, smoke scripts.
- `packages/intent-engine` - on-device intent stack and shared client orchestration.
- `infra` - database schema and infrastructure assets.
- `docs` - architecture and operational documentation.
- `json-formats` - top-level JSON format templates.
- `message-review` - payload/message contract examples.

Legacy compatibility wrappers are preserved inside `packages/intent-engine/brain` and `packages/intent-engine/llm` where needed.

## Architecture At A Glance

- On-device layer (`packages/intent-engine`):
  - collects local context,
  - applies consent gates,
  - infers abstract intent with runtime policy: ONNX embedded -> local small model -> deterministic classifier fallback.
- Server layer (`apps/api`):
  - accepts `intent_packet` via `POST /v1/intent-signal`,
  - generates and validates offers via `POST /v1/offer/generate`,
  - serves active offers, decisions, redemption, and wallet endpoints.
- UI layer (`apps/web`):
  - renders the user flow and merchant-facing screens for demo and evaluation.

Privacy contract: raw sensitive behavior stays local; only compact intent abstractions are sent to the API.

## Models And Runtime Split

- On-device SLM (edge-first):
  - Embedded ONNX runtime path (preferred when configured).
  - Local small model path (Ollama) as secondary.
  - Deterministic classifier as final safety fallback.
- Server LLM:
  - Offer generation defaults to `nvidia/nemotron-3-super-120b-a12b:free` via OpenRouter.

## Environment Setup

Use two env files for local development:

1. Copy root `.env.example` to `.env.local`.
2. Copy `apps/api/.env.example` to `apps/api/.env`.
3. Set `OPENROUTER_API_KEY` where required for live model runs.
4. Never commit `.env`, `.env.local`, or real secrets.
5. For GDPR-safe edge intent inference, set `INTENT_MODEL_PROVIDER=onnx` and keep `INTENT_ONNX_MODEL_PATH` plus Ollama fallback values configured.

Core env variables:

- API model routing:
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_SERVER_LARGE_MODEL` (highest-priority override)
  - `OPENROUTER_OFFER_MODEL` (or legacy `OPENROUTEROFFERMODEL`)
- Voice-agent routing:
  - `ELEVENLABS_API_KEY`
  - `ELEVENLABS_AGENT_ID`
  - `ELEVENLABS_BASE_URL` (optional, defaults to ElevenLabs public API)
- Intent model routing:
  - `INTENT_MODEL_PROVIDER` (`onnx`, `ollama`, `local`, `embedded`, `edge`)
  - `INTENT_ONNX_MODEL_PATH` (embedded ONNX model path)
  - `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`)
  - `OLLAMA_INTENT_MODEL` (default `nemotron-3-nano:4b`)
  - `GET /health` now returns `intent_provider`, `intent_model`, and `intent_mode`
- Frontend runtime routing:
  - `VITE_API_BASE_URL` (required for hosted frontend deployments)

## Run Matrix

From repo root:

```bash
# API
npm --prefix apps/api run start

# Web app
npm --prefix apps/web run dev
```

Useful workflows:

```bash
# API smoke
npm --prefix apps/api run smoke:e2e

# Full-model e2e (small model intent + server generation)
node apps/api/scripts/e2e-full-models.js

# Intent engine tests
node --test packages/intent-engine/brain/__tests__/*.test.js

# Web quality gates
npm --prefix apps/web run lint
npm --prefix apps/web run test
npm --prefix apps/web run build
```

Notes:

- `smoke:e2e` expects the API to already be running at `http://127.0.0.1:8080`.
- API startup currently requires `SUPABASE_URL` and `SUPABASE_KEY` to be defined.

## Canonical End-to-End Flow

1. Client builds `intent_packet` locally.
2. Client submits `POST /v1/intent-signal`.
3. Client requests `POST /v1/offer/generate`.
4. Client renders active cards from `GET /v1/offers/active`.
5. User decision and redemption are recorded and validated.
6. Merchant-side metrics and wallet impacts are reflected by API views.

## OpenRouter Browser-Safe Proxy (Optional Utility)

`apps/api/openrouter-proxy.js` is a direct relay utility for browser-safe key handling.

- Endpoint: `POST /v1/offer/openrouter`
- Health: `GET /health`

Run:

```bash
node apps/api/openrouter-proxy.js
```

Use this only as utility infrastructure; canonical judged flow remains through `apps/api/src/index.js`.

## Troubleshooting

- `OPENROUTER_API_KEY` missing:
  - API still runs, but offer generation may fallback to deterministic templates.
- Local small model unavailable:
  - Ensure Ollama is running and `OLLAMA_BASE_URL` is reachable.
- ONNX inference not used:
  - set `INTENT_MODEL_PROVIDER=onnx` and provide `INTENT_ONNX_MODEL_PATH`.
- Verify edge mode at runtime:
  - call `GET /health` and confirm `intent_mode` is `edge_local_only`.
- Validation errors:
  - check payloads against `apps/api/src/validation.js` contracts.

## Vercel Deployment (Web)

For `apps/web` deployments:

1. Set Vercel project root to `apps/web`.
2. Configure `VITE_API_BASE_URL` to your public API URL.
3. Run preview deployment first and verify:
   - onboarding (consumer + merchant),
   - offer detail and redemption flow,
   - merchant dashboard and scanner loop.
4. Promote to production only after preview smoke checks pass.

## Documentation

- Master roadmap: `Roadmap.md`
- On-device setup and verification: `setup.md`
- API-specific details: `apps/api/README.md`
- Web app notes: `apps/web/README.md`