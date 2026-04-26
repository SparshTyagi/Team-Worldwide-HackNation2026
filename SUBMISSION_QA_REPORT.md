# Submission QA Report

Date: 2026-04-26  
Scope: DSV submission readiness verification after UX and hardening updates.

## 1) Automated Verification

All commands run from repo root.

- `npm --prefix apps/web run test` -> pass (15/15 tests).
- `npm --prefix apps/web run build` -> pass.
- `node --test packages/intent-engine/brain/__tests__/*.test.js` -> pass (14 passed, 2 skipped due env-gated e2e).
- `node --test apps/api/__tests__/*.test.js` -> pass (5/5 tests).
- `npm --prefix apps/api run smoke:e2e` -> pass (`ok: true`).
- `npm --prefix apps/api run smoke:tavily` -> pass (`ok: true`).
- `node apps/api/scripts/e2e-full-models.js` -> pass (`ok: true`, two scenarios completed).

Notes:
- `npm --prefix apps/web run lint` currently reports many pre-existing formatting/type issues in `apps/web/src/components/spot/Screens.tsx` that are outside this change scope.
- Build warns about large bundle chunk size; this is known and non-blocking for demo submission.

## 2) DSV Module Evidence Checklist

- Context sensing shown with visible weather/time/location context in feed and flow.
- Dynamic generative offer path verified through API smoke and full-model e2e.
- Merchant rule and dashboard views present in merchant path.
- End-to-end redemption loop verified (offer decision -> token -> validation).
- Privacy boundary documented and surfaced in UX/docs.

Primary reference: `JUDGING.md`.

## 3) Manual Demo Capture Checklist

Attach evidence artifacts before final upload:

- [ ] Screenshot/video: context trigger moment (weather + location/time + demand/event signal)
- [ ] Screenshot/video: merchant rule setup and generated offer result
- [ ] Screenshot/video: consumer redemption token/QR and validation success
- [ ] Screenshot/video: merchant dashboard (overview + funnel + context performance)
- [ ] Screenshot/video: privacy explanation screen and verbal narrative in demo
- [ ] Backup scenario recording using fallback-ready flow

## 4) Remaining Operator Inputs

- Set/confirm `ELEVENLABS_AGENT_ID` for live merchant voice demo path.
- Confirm the final hosted API URL and set `VITE_API_BASE_URL` for deployed frontend.
- If deploying publicly, set `INTERNAL_API_KEY` and pass `X-Internal-Api-Key` for `/internal/*` operations.
