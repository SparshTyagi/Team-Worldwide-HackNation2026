# City Wallet Server

Backend MVP for the roadmap contracts.

## Run
- `node src/index.js`
- Health check: `GET /health`
- End-to-end smoke flow (server running): `npm run smoke:e2e`

## Model configuration
The canonical AI module now lives in `src/modules/shared/ai/client.js`.
The legacy path `src/llm/client.js` remains as a compatibility shim.

- Default model: `nvidia/nemotron-3-super-120b-a12b:free`
- Highest-priority override model var: `OPENROUTER_SERVER_LARGE_MODEL`
- Canonical override model var: `OPENROUTER_OFFER_MODEL`
- Backward-compatible aliases: `OPENROUTEROFFERMODEL`, `OPENROUTER_MODEL`
- API key env var: `OPENROUTER_API_KEY`

If the API key is missing, streaming fails, or model output is not valid JSON, the
server falls back to deterministic generation.

## ElevenLabs merchant voice agent
- `ELEVENLABS_API_KEY` is required for `/v1/merchant/voice-agent/session-token`.
- `ELEVENLABS_AGENT_ID` selects the Conversational AI agent used at runtime.
- Optional `ELEVENLABS_BASE_URL` defaults to `https://api.elevenlabs.io/v1`.

## Prompt files
- `prompts/offer_generation_system_prompt.txt`
- `prompts/offer_generation_task_prompt_template.txt`
- `prompts/maps_scrape_system_prompt.txt`

## Schema enforcement
- Strict input and output JSON schema validation is enabled for all endpoints.
- Unknown fields are rejected.
- Input validation failures return `400`.
- Output validation failures return `500` with `schema_output_validation_failed`.

## Install dependency
- `npm install @openrouter/sdk`

## Local env file
- Copy `apps/api/.env.example` to `apps/api/.env` (or edit the existing `apps/api/.env`).
- Set `OPENROUTER_API_KEY` to a **new** key after rotating any exposed one.
- `apps/api/.env` is gitignored; the server loads it automatically on startup.
- Root `.env.local` is supported as fallback after `apps/api/.env`.
- Root `.env` is supported as backward-compatible final fallback.
- If you run `openrouter-proxy.js`, export env vars in your shell or provide them inline for that process.
- For hosted `apps/web` deployments (e.g. Vercel), set `VITE_API_BASE_URL` in the web project to this API's public base URL.

## GDPR-safe intent runtime (edge-first)
- Set `INTENT_MODEL_PROVIDER=onnx` for edge-first inference.
- Keep `INTENT_ONNX_MODEL_PATH` configured to your local ONNX model file.
- Keep Ollama configured as local fallback: `OLLAMA_BASE_URL`, `OLLAMA_INTENT_MODEL`.
- In this mode, intent inference does not route to OpenRouter.
- Offer generation remains server-side and can use OpenRouter.

## Runtime observability
- Startup logs include resolved intent provider, mode, and model path/name.
- `GET /health` returns:
  - `intent_provider`
  - `intent_model`
  - `intent_mode` (`edge_local_only` or `remote_allowed`)

## Canonical challenge endpoint
- `POST /v1/offer/generate` accepts client intent packet and returns:
  - `offer` (canonical offer JSON),
  - `model_version`,
  - `prompt_version`,
  - `used_fallback`.

## Merchants (seed via HTTP)
- `POST /internal/merchants` — upsert one merchant row (strict JSON schema).
- `GET /internal/merchants` — list all merchants; optional `?merchant_id=m_3100`.
- Example flow: `apps/api/scripts/seed-merchants-and-offer.sh http://127.0.0.1:8080`
  - Prefix with `OPENROUTER_API_KEY=` for a fast deterministic offer (no live model call).
