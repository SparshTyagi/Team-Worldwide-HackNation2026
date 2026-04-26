# Generative City Wallet

Generative City Wallet is a privacy-first local commerce product built for the DSV Generative City-Wallet challenge. It detects user intent on-device, generates context-aware local offers in real time, and closes the loop with simulated redemption plus merchant analytics.

## Challenge Alignment

This submission is designed to prove all required DSV modules in one connected experience:

- Context sensing using multiple signal categories visible in-product
- Dynamic offer generation at runtime (not static coupon lookup)
- End-to-end redemption simulation with token/QR flow
- Consumer and merchant experiences in the same product
- Privacy-by-design with on-device interpretation and abstract intent uplink

See `JUDGING.md` for the explicit requirement-to-evidence mapping.

## Full User Flow

### Consumer flow (what the user experiences)

1. User opens app and chooses consumer role.
2. App guides onboarding (preferences, permissions, comfort profile).
3. Local context is interpreted into an intent packet on device.
4. API receives abstract intent (`POST /v1/intent-signal`).
5. Offer engine generates context-aware offer (`POST /v1/offer/generate`).
6. Feed displays multiple live offers (`GET /v1/offers/active`).
7. User opens offer detail with urgency, distance, and relevance cues.
8. User accepts offer (`POST /v1/offers/:id/decision`).
9. App creates redeem token (`POST /v1/redemption/create-token`).
10. Merchant scan is simulated; token is validated (`POST /v1/redemption/validate`).
11. Confirmation state is shown and wallet savings update is reflected.
12. User can review privacy controls and continue browsing.

### Merchant flow (what the business sees)

1. Merchant enters onboarding and challenge-fit setup.
2. Merchant defines constraints/goals (margin, windows, targeting boundaries).
3. Merchant configures voice identity profile (for assistant behavior).
4. Merchant submits for approval (simulated approval step in demo flow).
5. Merchant dashboard shows aggregate outcomes (uplift/funnel/context performance).
6. Merchant scanner screen supports redemption verification flow.
7. Merchant iterates configuration based on observed outcomes.

## End-to-End Technical Flow

Runtime policy for intent:
- Preferred: embedded ONNX (`INTENT_MODEL_PROVIDER=onnx`)
- Fallback: local small model (Ollama)
- Final fallback: deterministic classifier with same output contract

Canonical API lifecycle:

1. `POST /v1/intent-signal`
2. `POST /v1/offer/generate`
3. `GET /v1/offers/active`
4. `POST /v1/offers/:id/decision`
5. `POST /v1/redemption/create-token`
6. `POST /v1/redemption/validate`
7. Merchant dashboard endpoints for aggregate outcomes

## Engineering Decisions And Rationale

This section captures the most important implementation decisions and why they were made.

### 1) Privacy-first intent interpretation on device

- Decision: keep raw behavior interpretation in `packages/intent-engine` and only send abstract intent upstream.
- Why: aligns with GDPR-safe design and challenge guidance.
- Trade-off: less server-side personalization context, but stronger privacy boundary and clearer compliance story.

### 2) Tiered inference runtime (ONNX -> local small model -> deterministic fallback)

- Decision: support three intent runtime tiers with a stable output contract.
- Why: ensures reliability under different machine capabilities and demo conditions.
- Trade-off: fallback quality may be lower, but user flow remains uninterrupted.

### 3) Server-side offer generation with schema validation

- Decision: centralize generation in API and validate input/output JSON schemas.
- Why: protects flow integrity, prevents malformed offers, and keeps frontend deterministic.
- Trade-off: stricter validation can reject marginal outputs, but increases robustness.

### 4) Explicit consumer + merchant dual-surface product

- Decision: implement both customer and merchant paths in one integrated app demo.
- Why: DSV challenge requires supply and demand side proof, not only customer UI.
- Trade-off: broader scope, but much stronger business and judging narrative.

### 5) Simulated redemption loop before payment rail integration

- Decision: use token/QR lifecycle as a simulated checkout and validation path.
- Why: demonstrates complete system loop without full payment infrastructure dependency.
- Trade-off: no real settlement integration in MVP, but complete measurable flow is preserved.

### 6) Internal route protection for deployable safety

- Decision: require `INTERNAL_API_KEY` for `/internal/*` in deployed environments.
- Why: protects sensitive ingestion/control routes from public misuse.
- Trade-off: added operational setup, but safer production posture.

### 7) Merchant scope enforcement in dashboard APIs

- Decision: remove permissive fallback merchant behavior; enforce caller-bound merchant scope.
- Why: avoids cross-tenant data leakage risk and strengthens multi-merchant safety.
- Trade-off: stricter access behavior, but correct by default for real use.

### 8) UX-first mobile flow with 3-second comprehension

- Decision: prioritize offer cards and detail screens that communicate value, distance, expiry, and action quickly.
- Why: challenge explicitly evaluates interaction quality and comprehension speed.
- Trade-off: less dense analytics on primary consumer screens, but improved conversion clarity.

### 9) Visible degraded-mode behavior in frontend

- Decision: show user-visible status when live offers fail and fall back to demo cards.
- Why: avoids silent failures during demos and increases trust/transparency.
- Trade-off: exposes backend issues to users, but is preferable to hidden inconsistency.

### 10) Secure voice widget output handling

- Decision: avoid rendering raw session token and signed URL details directly in UI.
- Why: reduces accidental leakage in demo recordings/screenshots.
- Trade-off: less debug visibility in UI, but stronger security hygiene.

## System Architecture Overview

- `apps/web`: React + Vite mobile-first product UI (consumer and merchant journeys)
- `apps/api`: Node API orchestrator, offer pipeline, redemption lifecycle, merchant endpoints
- `packages/intent-engine`: on-device intent inference runtime and fallback policy
- `infra`: schema and infrastructure assets

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

## Deployment Notes

- Web deploy target: `apps/web` (Vercel-friendly)
- Set `VITE_API_BASE_URL` to your public API
- Keep `/internal/*` protected in production with `INTERNAL_API_KEY`

## Known MVP Boundaries

- Redemption is simulated (no live payment settlement rail integrated in this MVP).
- Some context feeds may run in realistic simulated mode depending on environment keys.
- Merchant approval is represented in demo flow for speed and clarity.

## Contributing

Contributions are welcome across product, engineering, UX, testing, and documentation.

### Where to start

- Open an issue describing the bug, feature, or improvement.
- For larger changes, include scope, impact, and validation plan.
- Align changes with challenge goals: context relevance, dynamic generation, redemption loop, and privacy-by-design.

### Development workflow

1. Fork and create a branch from `main`:
   - `feature/<short-description>` for new capabilities
   - `fix/<short-description>` for bug fixes
2. Keep PRs focused and reviewable (single concern per PR where possible).
3. Update docs when behavior, setup, or architecture changes.

### Quality gate before PR

Run from repo root:

```bash
npm --prefix apps/web run test
npm --prefix apps/web run build
npm --prefix apps/api run smoke:e2e
npm --prefix apps/api run smoke:tavily
node --test packages/intent-engine/brain/__tests__/*.test.js
```

If your change touches core flow reliability, also run:

```bash
node apps/api/scripts/e2e-full-models.js
```

### PR expectations

- Clear title and summary (what changed and why).
- Screenshots/video for UI/UX changes.
- Test evidence for changed paths.
- Notes on trade-offs, migrations, or risk areas.

### Security and sensitive data

- Never commit secrets (`.env`, keys, tokens, credentials).
- If you discover a security issue, do not open a public exploit report; share a private disclosure with maintainers first.

## Submission Documents

- DSV judge checklist and runbook: `JUDGING.md`
- QA verification and evidence checklist: `SUBMISSION_QA_REPORT.md`
- Deep architecture and roadmap: `Roadmap.md`
- Setup and model runtime notes: `setup.md`
- API module details: `apps/api/README.md`
- Web app details: `apps/web/README.md`