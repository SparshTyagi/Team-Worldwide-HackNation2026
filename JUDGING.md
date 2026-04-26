# DSV Submission Checklist (Generative City Wallet)

This file is the judge-facing map from the DSV brief requirements to concrete proof points in the product and repository.

Challenge brief reference:
- `challenge-resources/01 - DSV-Gruppe - Generative City Wallet.docx - Google Docs.pdf`

## 1) Required Module Compliance

| DSV requirement | Implementation evidence | Demo proof (what to show) |
|---|---|---|
| Context Sensing Layer with configurable real-time context; at least 2 visible signal categories | Context architecture and runtime policy documented in `Roadmap.md` and `README.md`; live context ingestion and trigger pipeline in `apps/api/src/services/context-fetcher.js`, `apps/api/src/modules/internal/service.js`; context-aware UX in `apps/web/src/components/spot/Screens.tsx` | Show weather + time/location (and demand/event proxy) influencing a specific generated offer in one scenario |
| Generative Offer Engine (dynamic, not static); merchant sets rules/goals | Dynamic offer generation via `POST /v1/offer/generate` in `apps/api/src/index.js` and generation client in `apps/api/src/modules/shared/ai/client.js`; merchant rule interfaces in `apps/web/src/components/spot/Screens.tsx` and merchant APIs in `apps/api/src/modules/merchant/service.js` | In merchant flow, set a rule/goal, then trigger a runtime-generated offer and confirm it is not from static coupon tables |
| Seamless Checkout & Redemption (simulated checkout accepted); consumer + merchant views | Redemption token create/validate endpoints in `apps/api/src/index.js`; consumer flow in `apps/web/src/routes/index.tsx` and `apps/web/src/components/spot/Screens.tsx`; merchant dashboard/scanner views in `apps/web/src/components/spot/Screens.tsx` | Accept offer -> show QR/token -> simulate scan/validation -> show success and merchant-side metrics update |
| End-to-end connected flow (context -> generation -> display -> decision -> redemption) | Canonical flow in `README.md` and `Roadmap.md`; API orchestration in `apps/api/src/index.js`; full frontend screen state machine in `apps/web/src/routes/index.tsx` | Run complete scenario in under 6 minutes without changing code during demo |
| Merchant dashboard/summary required (static mockup acceptable) | Merchant dashboard sections in `apps/web/src/components/spot/Screens.tsx`; backend overview/funnel/context-performance endpoints in `apps/api/src/index.js` | Show overview KPIs, funnel, and context-performance interpretation on merchant side |
| GDPR/privacy-by-design intent handling | Privacy contract documented in `README.md` and `Roadmap.md`; edge-first runtime in `packages/intent-engine` with abstract intent upstream | Show privacy screen and explain boundary: local behavior stays on device, only abstract intent signal is sent |
| 3-second UX comprehension requirement | Mobile flow and card hierarchy in `apps/web/src/components/spot/Screens.tsx`; action-driven flow in `apps/web/src/routes/index.tsx` | In first offer view, user can immediately identify relevance, value, timing/expiry, and CTA without scrolling |

## 2) What Is Simulated vs Live

- Simulated/stub-friendly:
  - Payone transaction-density feed (`/internal/context/ingest/payone-sim` path in `apps/api/src/index.js`).
  - Redemption checkout validation is simulated API flow (no real payment rail settlement in MVP).
- Live-capable when configured:
  - Weather/events/context ingestion (`TAVILY_API_KEY` in `.env.local`/`apps/api/.env`).
  - Server generative path (`OPENROUTER_API_KEY`).
  - Merchant voice agent (`ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`).

## 3) 4-6 Minute Demo Runbook

1. **Problem framing (20s):** Mia scenario; static coupons fail at moment relevance.
2. **Context proof (40s):** show active context signals (weather + time/location + demand/event proxy).
3. **Intent/privacy proof (35s):** explain on-device interpretation and abstract intent uplink only.
4. **Generative offer proof (55s):** trigger dynamic offer generation with merchant constraints.
5. **Consumer decision and redemption (60s):** accept, open QR/token, simulate scan, confirmation.
6. **Merchant outcomes (55s):** show dashboard overview/funnel/context-performance + voice setup.
7. **Compliance close (25s):** restate all 3 DSV modules and privacy-by-design boundary.

## 4) Submission-Day Checklist

- Environment and health:
  - API responds at `GET /health`.
  - `VITE_API_BASE_URL` points to active API host.
  - `SUPABASE_URL` and `SUPABASE_KEY` are present for API startup.
  - `ELEVENLABS_AGENT_ID` is set for live voice session demo path.
- Quality gates:
  - `npm --prefix apps/web run test`
  - `npm --prefix apps/web run build`
  - `node --test packages/intent-engine/brain/__tests__/*.test.js`
  - `npm --prefix apps/api run smoke:e2e` (API already running)
- Demo reliability:
  - One backup scenario prepared (if external context provider is degraded).
  - One explicit statement of what is simulated vs live.
  - Screenshots/video snippets captured for each DSV required module.

