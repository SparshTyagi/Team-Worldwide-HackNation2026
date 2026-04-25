# City Wallet Server

Backend MVP for the roadmap contracts.

## Run
- `node src/index.js`
- Health check: `GET /health`

## Model configuration
The server now uses OpenRouter SDK in `src/llm/client.js`.

- Default model: `nvidia/nemotron-3-super-120b-a12b:free`
- Override model with: `OPENROUTER_MODEL`
- API key env var: `OPENROUTER_API_KEY`

If the API key is missing, streaming fails, or model output is not valid JSON, the
server falls back to deterministic generation.

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
- Copy `server/.env.example` to `server/.env` (or edit the existing `server/.env`).
- Set `OPENROUTER_API_KEY` to a **new** key after rotating any exposed one.
- `server/.env` is gitignored; the server loads it automatically on startup.

## Merchants (seed via HTTP)
- `POST /internal/merchants` — upsert one merchant row (strict JSON schema).
- `GET /internal/merchants` — list all merchants; optional `?merchant_id=m_3100`.
- Example flow: `server/scripts/seed-merchants-and-offer.sh http://127.0.0.1:8080`
  - Prefix with `OPENROUTER_API_KEY=` for a fast deterministic offer (no live model call).
