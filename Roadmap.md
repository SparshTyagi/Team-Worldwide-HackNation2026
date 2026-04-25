# Generative City Wallet - Master Roadmap and Architecture Playbook

## 1) What We Are Building (One-Liner)

An AI-powered city wallet that detects high-relevance local moments in real time, generates personalized offers on demand (not from static coupon tables), and closes the loop with a simulated checkout + merchant analytics dashboard.

---

## 2) Challenge-First Strategy (What Judges Need to See)

To win, the demo must prove all required modules in one connected flow:

1. **Context sensing** with at least 2 real signal categories (weather/time/location/events/demand proxies).
2. **Dynamic generative offer engine** (copy + layout + discount logic generated at runtime).
3. **Seamless redemption** (QR/token/cashback simulation) with consumer and merchant views.
4. **Merchant rule interface** where merchant sets goals and constraints, AI executes.
5. **GDPR-aware design**: private behavior interpreted on-device (SLM), only abstract intent sent server-side.
6. **3-second UX**: user immediately understands value, distance, expiry, and action.

---

## 3) Product Scope (Hackathon MVP vs. Future)

### MVP In-Scope (Must Build)

- Mobile app with push + in-app offer card.
- Context ingestion pipeline (weather + location + time + simulated merchant demand; optionally events).
- On-device intent inference using SLM or distilled classifier.
- Server-side offer generation orchestration with guardrails.
- Offer acceptance/dismissal + expiry handling.
- Simulated checkout redemption using dynamic QR/token or cashback ledger.
- Merchant dashboard with rule setup + aggregate performance metrics.

### Stretch (If Time Allows)

- AR-lite overlay prototype (camera + directional arrow).
- Multi-offer ranking and adaptive channel selection.
- Explainability panel ("why this offer now").
- A/B testing for tone style (factual vs emotional copy).

### Explicitly Out-of-Scope for Hackathon

- Full production payment integration.
- Large-scale merchant onboarding platform.
- Long-horizon user behavior modeling (months of history).
- Complex loyalty economy.

---

## 4) Onboarding-First Product Flow (Placed Early by Design)

Onboarding is a first-class module, not an appendix. It determines model inputs, consent boundaries, channel permissions, and offer quality from day one.

Why onboarding comes early in this roadmap:
- It defines what the SLM is allowed to use.
- It defines what the server is allowed to receive.
- It sets all user constraints before any generation logic runs.
- It directly affects merchant outcomes through better intent quality.

Flow order:
1. User completes onboarding profile and consent choices.
2. On-device SLM creates abstract intent from approved features.
3. Server generates offers only within privacy and locality boundaries.
4. User accepts/dismisses/redeems.
5. Merchant receives aggregate analytics.

Detailed form-by-form onboarding spec is documented in `Appendix A`.

---

## 5) End-to-End System Architecture

### 4.1 High-Level Components

1. **Client (Mobile App)**
   - Context collector (location/time/device state).
   - On-device intent engine (SLM/classifier).
   - Offer renderer (GenUI card).
   - Redemption wallet (QR/token display, cashback balance).
   - Consent & privacy controls.

2. **Server (Backend API + Orchestrator)**
   - Context aggregation service.
   - Trigger and scoring engine.
   - Offer generation orchestrator (LLM + policy checks).
   - Offer lifecycle service (created, shown, accepted, expired, redeemed).
   - Redemption validation service.
   - Merchant analytics and dashboard APIs.

3. **Data Layer**
   - Operational DB (users, merchants, offers, redemptions, rules).
   - Time-series/event store (context snapshots, funnel events).
   - Cache (nearby merchants/context prefetch).

4. **External Data Integrations**
   - Weather API.
   - Event API.
   - Maps/POI API.
   - Simulated Payone transaction-density feed.

5. **AI Layer**
   - On-device SLM for private interpretation.
   - Server LLM for offer generation + constrained output schema.
   - Optional ranking model for offer relevance score.

### 4.2 Reference Architecture (Text Diagram)

`Mobile Client -> Intent Signal API -> Context/Scoring Engine -> Offer Generator -> Offer Store -> Delivery API -> Mobile UI -> Redemption API -> Merchant Analytics`

With side channels:
- `Weather/Event/Map/Payone feeds -> Context Engine`
- `User actions -> Event Stream -> Dashboard Aggregates`

### 4.3 Local-Area Candidate Strategy (Efficiency + Privacy)

Do not score the entire city for every user interaction. Use a local-area candidate stage first.

Recommended flow:
1. Client computes a local search envelope (for example 1-3 km radius or geohash cell set).
2. Client sends one of:
   - `radius_km` + coarse center token, or
   - `area_cell_ids` (preferred for privacy), or
   - pre-filtered nearby `merchant_ids`.
3. Server fetches only merchants in that envelope.
4. Trigger scoring + LLM generation runs only on that subset.
5. Client performs final distance sort locally before rendering.

Why this is better:
- Cuts compute and latency versus whole-city candidate generation.
- Reduces token usage and generation cost.
- Preserves privacy by avoiding exact raw location traces.
- Improves relevance by focusing only on reachable merchants.

---

## 6) SLM vs LLM Split (Privacy + Performance)

### On Device (SLM / Tiny Model)

**Purpose:** Infer intent from sensitive personal signals without exposing raw personal data.

Inputs kept local:
- Fine-grained movement pattern (e.g., stop-go behavior).
- App interaction hints (recent dismissals/acceptances).
- Device context (battery, focus mode, session state).

Output sent to backend (safe abstraction):
- `intent_label` (e.g., `warm_break_seek`, `quick_lunch`, `window_shopping`).
- `intent_confidence` (0-1).
- `offer_receptivity` (low/medium/high).
- Optional tone preference (`factual`, `emotional`, `neutral`).

### Server Side (LLM / Orchestrated Prompting)

**Purpose:** Compose dynamic offer content and UI spec from merchant constraints + live context + abstract intent.

Server LLM does:
- Offer text generation.
- Urgency framing.
- Visual spec hints for GenUI card.
- Structured JSON output for deterministic rendering.

Server LLM must not receive:
- Raw GPS traces.
- Raw behavioral event stream.
- Personally identifiable free-text profiles.

### 5.1 SLM Input Specification (On-Device Only)

Raw/local feature groups consumed by the on-device model:

1. **Temporal features**
   - local hour bucket (`morning`, `lunch`, `afternoon`, `evening`),
   - day type (`weekday`, `weekend`),
   - time budget estimate from dwell behavior.
2. **Mobility features**
   - movement state (`walking`, `stationary`, `transit`),
   - stop frequency in last 10-15 minutes,
   - speed bucket (not raw sensor stream in server payload).
3. **Preference features**
   - explicit onboarding interests and exclusions,
   - preferred distance and preferred times.
4. **Behavioral adaptation features**
   - rolling accept/dismiss/redeem rates by category,
   - last N interactions with recency decay,
   - notification fatigue indicator.
5. **Permission mask**
   - feature gates derived from consent toggles.

Important: this feature table exists only on-device and is never uploaded in raw form.

### 5.2 SLM Output Contract (Client -> Server)

The SLM emits a compact, structured "intent packet" used by server ranking and LLM generation.

Required fields:
- `intent_label`: canonical class (example: `warm_break_seek`).
- `intent_confidence`: `0.0-1.0`.
- `receptivity_level`: `low | medium | high`.
- `time_budget_minutes`: integer range (for example `3-60`).
- `mobility_mode`: `walking | stationary | transit`.
- `sensitivity_level`: `low | medium | high` (drives conservative copy).
- `tone_preference`: `factual | emotional | neutral | minimal`.
- `hard_constraints`: list derived from onboarding (`no_alcohol`, `vegetarian_only`).
- `locality`: `radius_km` and/or `area_cell_ids`.

Optional fields:
- `next_best_intents`: top-2 alternatives with confidence.
- `intent_stability_score`: confidence stability over recent windows.
- `cold_start_flag`: true for first sessions.

### 5.3 Intent Label Taxonomy (Starter Set)

Use a fixed taxonomy to avoid prompt entropy:

- `warm_break_seek`
- `quick_lunch_now`
- `browse_local_shops`
- `after_work_unwind`
- `errand_mode_daily_needs`
- `event_adjacent_visit`
- `low_receptivity_do_not_push` (suppression intent)

Recommendation: cap to 8-15 labels for MVP and map all edge cases to nearest class.

### 5.4 SLM Runtime Decision Policy

Before sending to server:

1. If permissions block core features, run reduced feature model.
2. If confidence < threshold (example `0.55`), fallback to conservative intent:
   - `browse_local_shops` or `low_receptivity_do_not_push`.
3. If fatigue score high, suppress push and mark `channel_hint=in_app_only`.
4. Attach only allowed locality limiter (`radius_km`/cells), never exact trace.

### 5.5 LLM Input Contract (Server Internal)

The server builds one normalized generation payload:

- `merchant_profile`:
  - category, open/closed status, price band, margin guardrails.
- `merchant_rule_constraints`:
  - max discount %, max campaign spend/day, excluded SKUs, active windows.
- `context_snapshot`:
  - weather summary, event intensity, demand gap metrics, local time.
- `intent_packet`:
  - SLM output fields only (no raw personal logs).
- `candidate_offer_space`:
  - eligible products/bundles with price and margin bounds.
- `channel_context`:
  - push vs in-app vs widget constraints.
- `compliance_policy`:
  - prohibited claims, legal phrases, safe-tone overrides.

### 5.6 LLM Output Contract (Server Internal -> UI/Offer Services)

Canonical response shape is defined in `13.2 Canonical Server LLM Output (Single Source of Truth)`.
This section intentionally avoids duplicating field definitions.

### 5.7 Post-LLM Validation and Fallback Tree

1. **Schema validation** (hard fail if malformed JSON).
2. **Business rule validation**:
   - discount <= merchant max,
   - merchant open now,
   - SKU allowed,
   - expiry within policy.
3. **Policy validation**:
   - no manipulative/excessive urgency language,
   - no prohibited categories for user constraints.
4. **Fallback path**:
   - deterministic template generator with same output schema.
5. **Final channel adaptation**:
   - trim copy per channel char budget before delivery.

---

## 7) Intent Schema Design (Critical Contract)

Use a strict schema between client and backend.

```json
{
  "intent_id": "uuid",
  "timestamp_utc": "2026-04-25T20:30:00Z",
  "user_pseudonym": "usr_9f2a",
  "intent_label": "warm_break_seek",
  "intent_confidence": 0.82,
  "receptivity_level": "high",
  "time_budget_minutes": 12,
  "mobility_mode": "walking",
  "tone_preference": "emotional",
  "privacy_flags": {
    "raw_location_shared": false,
    "raw_behavior_shared": false
  },
  "city_context_ref": "ctx_stuttgart_20260425_1130"
}
```

Validation rules:
- Reject if confidence < threshold and no fallback intent.
- Require pseudonymous ID (never email/phone).
- Enforce enum values to avoid prompt injection via free text.
- Require at least one locality limiter for server processing:
  - `radius_km`, or
  - `area_cell_ids`, or
  - `nearby_merchant_ids`.

---

## Appendix A) Initial Onboarding System (Client Spec + Data Contracts)

This onboarding is designed specifically for the on-device intent engine. It collects only preference and permission data needed for personalization and keeps it local by default.

### 6A.1 Product Principles for Onboarding

- Minimize cognitive load: each form is short, one question focus.
- Explain value in plain words ("better nearby offers"), not technical language.
- Collect only what improves intent quality.
- Store profile on-device; sync only consent-safe abstractions.
- Make permission choices reversible in settings.

### 6A.2 Form 1 - Location and Language

**Question shown to user:** "Where should we personalise your local offers?"

- `city_region` (dropdown, required): Stuttgart, Berlin, Munich, Hamburg, Cologne, Frankfurt, Other.
- `preferred_language` (dropdown, required): German, English.
- `location_mode` (single-select, required): Approximate location only, Precise nearby offers, Ask me later.

Internal values:

```json
{
  "city": "stuttgart",
  "language": "de",
  "location_mode": "precise_nearby_offers"
}
```

### 6A.3 Form 2 - Interest Categories

**Question shown to user:** "What kind of local offers would you like to see?"

- `food_drink_interests` (multi-select, optional): Coffee, Bakery, Lunch, Dinner, Desserts, Fast food, Healthy food.
- `shopping_interests` (multi-select, optional): Fashion, Books, Electronics, Beauty, Home goods, Gifts.
- `lifestyle_interests` (multi-select, optional): Fitness, Wellness, Museums, Cinema, Music, Nightlife, Local events.
- `daily_needs` (multi-select, optional): Groceries, Pharmacy, Laundry, Haircut, Repair services.

Internal values:

```json
{
  "interests": [
    "coffee",
    "bakery",
    "lunch",
    "local_events",
    "groceries"
  ]
}
```

### 6A.4 Form 3 - Offer Style Preferences

**Question shown to user:** "How should we choose offers for you?"

- `discount_preference` (single-select, required): Nearby convenience, Highest discount, Balanced, Only high-value offers.
- `offer_tone` (single-select, required): Factual, Friendly, Minimal, Playful.
- `walking_distance` (single-select, required): Under 2 minutes, Under 5 minutes, Under 10 minutes, No preference.
- `offer_frequency` (single-select, required): 1 per day, 2 per day, 3 per day, Only very relevant offers.

Internal values:

```json
{
  "discount_preference": "balanced",
  "offer_tone": "friendly",
  "walking_distance": "under_5_min",
  "max_offers_per_day": 2
}
```

### 6A.5 Form 4 - Timing Preferences

**Question shown to user:** "When would you like to receive offers?"

- `preferred_offer_times` (multi-select, optional): Morning, Lunch break, Afternoon, After work, Evening, Weekends.
- `quiet_hours_start` (time picker, required): default 21:00.
- `quiet_hours_end` (time picker, required): default 08:00.
- `weekend_offers` (toggle, required): On, Off.

Internal values:

```json
{
  "preferred_times": [
    "lunch_break",
    "after_work",
    "weekends"
  ],
  "quiet_hours": {
    "start": "21:00",
    "end": "08:00"
  },
  "weekend_offers": true
}
```

### 6A.6 Form 5 - Restrictions and Exclusions

**Question shown to user:** "Any preferences we should respect?"

- `dietary_preferences` (multi-select, optional): No preference, Vegetarian, Vegan, Halal, Gluten-free, Dairy-free.
- `excluded_categories` (multi-select, optional): Alcohol, Meat, Fast food, Nightlife, Gambling, None.
- `accessibility_preferences` (multi-select, optional): Step-free access, Short walking distance, Seating available, Accessible toilet, No preference.
- `allergies` (multi-select/text, optional): Nuts, Dairy, Gluten, Seafood, Other, None.

Internal values:

```json
{
  "dietary_preferences": [
    "vegetarian"
  ],
  "excluded_categories": [
    "alcohol"
  ],
  "accessibility_preferences": [
    "short_walking_distance"
  ],
  "allergies": []
}
```

### 6A.7 Form 6 - Privacy and Personalisation Controls

**Question shown to user:** "Choose how City Wallet can personalise your offers."

- `precise_location` (toggle, required): Allow, Do not allow.
- `background_location` (toggle, optional): Allow, Do not allow.
- `learn_from_accepted_offers` (toggle, required): Allow, Do not allow.
- `learn_from_dismissed_offers` (toggle, required): Allow, Do not allow.
- `learn_from_redeemed_offers` (toggle, required): Allow, Do not allow.
- `push_notifications` (toggle, required): Allow, Do not allow.
- `anonymous_merchant_analytics` (toggle, required): Allow, Do not allow.

Internal values:

```json
{
  "permissions": {
    "precise_location": true,
    "background_location": false,
    "learn_from_accepted_offers": true,
    "learn_from_dismissed_offers": true,
    "learn_from_redeemed_offers": true,
    "push_notifications": true,
    "anonymous_merchant_analytics": true
  }
}
```

### 6A.8 Final Combined On-Device Profile (Stored Locally)

```json
{
  "user_intent_profile": {
    "city": "stuttgart",
    "language": "de",
    "location_mode": "precise_nearby_offers",
    "interests": [
      "coffee",
      "bakery",
      "lunch",
      "local_events",
      "groceries"
    ],
    "offer_preferences": {
      "discount_preference": "balanced",
      "offer_tone": "friendly",
      "walking_distance": "under_5_min",
      "max_offers_per_day": 2
    },
    "timing_preferences": {
      "preferred_times": [
        "lunch_break",
        "after_work",
        "weekends"
      ],
      "quiet_hours": {
        "start": "21:00",
        "end": "08:00"
      },
      "weekend_offers": true
    },
    "restrictions": {
      "dietary_preferences": [
        "vegetarian"
      ],
      "excluded_categories": [
        "alcohol"
      ],
      "accessibility_preferences": [
        "short_walking_distance"
      ],
      "allergies": []
    },
    "permissions": {
      "precise_location": true,
      "background_location": false,
      "learn_from_accepted_offers": true,
      "learn_from_dismissed_offers": true,
      "learn_from_redeemed_offers": true,
      "push_notifications": true,
      "anonymous_merchant_analytics": true
    }
  }
}
```

### 6A.9 Fields Excluded from the Intent Model

The following may exist for account operations but must not feed the SLM/intent generator:

- `first_name` (not required for intent).
- `email` (authentication only).
- `phone_number` (authentication/recovery only).
- `full_date_of_birth` (sensitive, unnecessary).
- `exact_home_address` (sensitive, unnecessary).
- `gender` (not necessary for intent quality).
- `income` (invasive and high-risk).
- `employer` (not relevant).
- `contacts` (not relevant).
- `payment_card_details` (checkout scope only, never for intent).

### 6A.10 Onboarding-to-Intent Feature Mapping

How profile fields become safe model features:

- `interests` + `timing_preferences` -> candidate intent classes.
- `walking_distance` + `location_mode` -> proximity threshold features.
- `offer_tone` + language -> message style control tokens.
- `dietary/exclusions/allergies` -> hard negative filters.
- `max_offers_per_day` + quiet hours -> notification budget constraints.
- permission flags -> runtime feature gating (if disabled, feature set is dropped).

Example intent outputs:
- `warm_drink_nearby`
- `quick_lunch_now`
- `after_work_event_interest`

### 6A.11 Permission Gating Rules (Runtime)

- If `precise_location=false`, use only approximate location bucket.
- If `background_location=false`, no background trigger scans.
- If `push_notifications=false`, route offers to in-app feed only.
- If learning toggles are disabled, do not store event outcomes for local adaptation.
- If anonymous analytics is disabled, exclude user from merchant aggregate computation.
- If location is approximate-only, server query must use coarse `area_cell_ids` (no exact lat/lon).

### 6A.12 Storage and Sync Boundaries

- Store full profile in encrypted local storage.
- Sync to server only:
  - pseudonymous user ID,
  - abstract intent signals,
  - locality limiter (`radius_km` with coarse center token or `area_cell_ids`),
  - delivery permissions needed for channel routing.
- Never sync raw onboarding free text, allergy details, or exact location traces.

### 6A.13 Settings and Re-Consent UX

- Every onboarding field must be editable in Settings.
- Critical permission changes show immediate effect preview.
- Re-consent required after major policy updates.
- "Reset personalization" option clears local profile and retrains from zero.

---

## 8) Data Model and Financial Signals

### 7.1 Core Entities

- `User` (pseudonymous profile, consent state, preferences).
- `Merchant` (category, geo, business hours, offer constraints).
- `MerchantRule` (max discount, campaign goal, excluded products, time windows).
- `ContextSnapshot` (weather, local event index, transaction density, location cell, timestamp).
- `Offer` (generated content, discount logic, validity, status).
- `OfferEvent` (delivered/opened/accepted/dismissed/expired).
- `Redemption` (token/QR, simulated transaction, cashback outcome).
- `MerchantMetricDaily` (CTR, accept rate, redemption rate, revenue impact estimates).

### 7.2 Financial Data Required

For the challenge, use realistic but simulated financial and transactional fields:

- `merchant_transaction_density_index` (e.g., percentile vs last 4 weeks).
- `baseline_hourly_tx_count`.
- `current_hour_tx_count`.
- `quiet_hour_gap_pct`.
- `avg_ticket_size_eur`.
- `offer_discount_cost_eur`.
- `simulated_incremental_revenue_eur`.
- `simulated_margin_impact_pct`.
- `cashback_issued_eur`.
- `redemption_count` and `redemption_value_eur`.
- `candidate_merchants_scanned_count` (efficiency KPI).
- `avg_offer_generation_latency_ms` (before/after locality filtering).

### 7.3 Merchant Outcome KPIs (What to Present)

- Fill-rate of quiet hours.
- Cost per redeemed offer.
- Redemption uplift vs baseline.
- Acceptance rate by context cluster (rainy lunch, cold evening, etc.).
- Net gain estimate (incremental revenue - discount cost).

---

## 9) Offer Generation Pipeline

1. **Context ingestion** every N minutes/event-driven.
2. **Locality filter stage**:
   - Build candidate set from `radius_km` or `area_cell_ids` or `nearby_merchant_ids`.
   - Drop merchants outside local envelope before scoring.
3. **Composite trigger scoring**:
   - Weather score.
   - Demand-drop score.
   - Proximity score.
   - Intent-match score.
4. **Trigger threshold check**.
5. **Constraint retrieval** from merchant rule profile.
6. **LLM generation** with strict JSON schema output.
7. **Policy guardrails**:
   - Discount within merchant max.
   - Expiry not longer than configured limit.
   - No prohibited claims.
8. **Delivery decision** (push vs in-app).
9. **Track interaction** and feed analytics.

---

## 10) API Surface (MVP Contract)

### Client-Facing APIs

- `POST /v1/intent-signal` - submit abstract on-device intent.
- `GET /v1/offers/active` - fetch live generated offers.
- `POST /v1/offers/{id}/decision` - accept/dismiss action.
- `POST /v1/redemption/create-token` - create QR/token.
- `POST /v1/redemption/validate` - validate token at merchant.
- `GET /v1/wallet/cashback` - view simulated cashback balance.

### Merchant APIs

- `GET /v1/merchant/dashboard/overview`.
- `GET /v1/merchant/dashboard/funnel`.
- `GET /v1/merchant/dashboard/context-performance`.
- `POST /v1/merchant/rules`.
- `PATCH /v1/merchant/rules/{id}`.

### Internal APIs

- `POST /internal/context/ingest/weather`.
- `POST /internal/context/ingest/events`.
- `POST /internal/context/ingest/payone-sim`.
- `POST /internal/generation/run`.

Locality request shape (recommended):

```json
{
  "user_pseudonym": "usr_9f2a",
  "intent_label": "warm_break_seek",
  "intent_confidence": 0.82,
  "locality": {
    "mode": "area_cells",
    "radius_km": 2.0,
    "area_cell_ids": ["u0wtw3", "u0wtw9", "u0wtwd"]
  }
}
```

---

## 11) Merchant Dashboard Blueprint

### 10.0 Merchant Constraint System (What Merchants Can Control)

Merchant controls must be simple enough for non-technical operators while still giving safe business boundaries to the AI.

Constraint categories:

1. **Campaign goal constraints**
   - `campaign_goal`: `fill_quiet_hours | clear_inventory | increase_repeat_visits | increase_avg_ticket`.
   - `priority_goal_weight`: numeric slider (for multi-goal balancing).

2. **Discount and budget constraints**
   - `max_discount_pct` (hard cap).
   - `max_discount_amount_eur` (absolute cap).
   - `daily_campaign_budget_eur`.
   - `weekly_campaign_budget_eur`.
   - `max_redemptions_per_day`.
   - `max_cashback_per_redemption_eur`.

3. **Product and category constraints**
   - `eligible_categories` (for example beverages only).
   - `excluded_skus`.
   - `min_order_value_eur`.
   - `bundle_required` (for combo offers).
   - `inventory_guardrail` (do not promote low-stock SKU).

4. **Time and validity constraints**
   - `active_days` and `active_hours`.
   - `max_offer_validity_minutes`.
   - `blackout_periods` (for peak hours when no discount is desired).
   - `cooldown_minutes_per_user` (avoid repeated exposures).

5. **Geographic and reach constraints**
   - `service_radius_km` (merchant preferred catchment area).
   - `allowed_area_cells` (if radius is not enough).
   - `max_walking_time_minutes`.

6. **Channel and UX constraints**
   - `allowed_channels`: `push | in_app | widget`.
   - `max_push_per_day`.
   - `tone_whitelist`: `factual | friendly | minimal` (merchant can disable playful).
   - `brand_safety_terms`: required/forbidden words.

7. **Compliance and policy constraints**
   - regulated category restrictions (for example alcohol timing windows).
   - age-restricted promotions blocked by default.
   - legal disclaimer templates by category.
   - mandatory tax/VAT display rules where relevant.

8. **Fairness and reputation constraints**
   - `repeat_targeting_limit` (avoid hitting same users repeatedly).
   - `sensitive_context_blocklist` (for example no urgency framing for high-sensitivity intents).
   - conservative mode toggle for brand reputation protection.

Example merchant rule payload:

```json
{
  "merchant_id": "m_1021",
  "campaign_goal": "fill_quiet_hours",
  "constraints": {
    "max_discount_pct": 20,
    "daily_campaign_budget_eur": 120,
    "eligible_categories": ["hot_drinks", "pastries"],
    "excluded_skus": ["alcohol"],
    "active_hours": ["10:00-12:00", "15:00-17:30"],
    "max_offer_validity_minutes": 20,
    "service_radius_km": 2.0,
    "max_push_per_day": 2,
    "tone_whitelist": ["factual", "friendly"],
    "repeat_targeting_limit": 2
  }
}
```

### 10.1 Main Screens

1. **Overview**
   - Today's offers generated.
   - Acceptance rate.
   - Redemption rate.
   - Estimated incremental revenue.

2. **Rule Builder**
   - Campaign goal selector: `fill_quiet_hours`, `clear_inventory`, `increase_repeat_visits`.
   - Max discount slider (e.g., 5-20%).
   - Valid time windows.
   - Excluded SKUs/categories.

3. **Context Performance**
   - Which contexts trigger best outcomes.
   - Heatmap by day/hour/weather.
   - "Top converting trigger combos."

4. **Offer Explorer**
   - Generated offers list.
   - Status chips (shown, accepted, redeemed, expired).
   - Explainability panel: "generated because rain + low demand + warm intent."

5. **Redemption and Finance**
   - Redeemed token count.
   - Total discount issued.
   - Simulated net uplift.
   - Cashback payout summary.

### 10.2 Merchant Analytics Catalog (What They See)

All analytics are aggregated and privacy-safe (no user-level tracking export).

1. **Acquisition and exposure metrics**
   - offers generated,
   - offers delivered by channel,
   - delivery success rate,
   - unique reached users (pseudonymous aggregate).

2. **Engagement funnel metrics**
   - viewed/opened rate,
   - accept rate,
   - dismiss rate,
   - ignore rate,
   - drop-off by funnel step.

3. **Redemption metrics**
   - redemption count,
   - redemption rate from accepted offers,
   - token validation success/fail rate,
   - average time-to-redeem.

4. **Financial outcome metrics**
   - total discount cost,
   - total cashback issued,
   - estimated incremental revenue,
   - estimated net uplift,
   - cost per redeemed offer,
   - ROI proxy by campaign goal.

5. **Context-performance metrics**
   - conversion by weather bucket,
   - conversion by daypart (`morning`, `lunch`, etc.),
   - conversion by demand-gap tier,
   - top trigger combinations ranked by redemption rate.

6. **Offer quality metrics**
   - accept rate by tone style,
   - accept rate by discount type,
   - performance by validity window length,
   - fatigue indicator (declining response with high frequency).

7. **Operational and reliability metrics**
   - average generation latency,
   - schema validation fail rate,
   - fallback template usage rate,
   - redemption API error rate.

8. **Budget and pacing metrics**
   - budget spent vs daily/weekly cap,
   - projected spend by end of day/week,
   - cap-hit alerts (offers auto-paused when cap reached),
   - pacing recommendations.

9. **Audience and fairness safeguards**
   - repeat-targeting distribution buckets,
   - suppression counts due to privacy/permission limits,
   - blocked offers due to compliance constraints.

10. **Comparative reporting**
   - period-over-period comparison (today vs yesterday, this week vs last week),
   - campaign goal comparison (quiet-hour fill vs repeat-visit campaigns),
   - benchmark vs merchant's own historical baseline.

### 10.3 Dashboard Views to Implement for MVP Demo

Minimum panels to show in demo:

- KPI strip: generated, accepted, redeemed, net uplift.
- Funnel chart: delivered -> viewed -> accepted -> redeemed.
- Context heatmap: daypart x weather.
- Budget panel: spend, remaining budget, forecast.
- Offer table: generated offer, tone, discount, outcome.
- Explanation drawer: "why this offer was generated."

### 10.4 Alerting and Recommendations Layer

Merchant-facing smart alerts:

- "Quiet hour detected now; AI recommending stronger urgency."
- "Budget pace too fast; discount reduced from 20% to 15% suggestion."
- "Push fatigue rising; switch to in-app for next 2 hours."
- "Best-performing trigger today: cold weather + low demand + lunch."

Merchant-facing actions from alerts:

- one-click approve recommendation,
- one-click reject recommendation,
- snooze recommendations for X hours.

### 10.5 UX Requirements for Dashboard

- Fast-glance card metrics (merchant has low time).
- Explain AI in plain language.
- Privacy-safe aggregates only (no user stalking panels).

---

## 12) Consumer Experience Blueprint

### 12.1 Entry Channels

- Push notification for urgent context windows.
- In-app "Nearby now" feed for non-urgent.
- Optional lock-screen widget for glanceable offers.

### 12.2 Offer Card Structure (3-Second Rule)

Top area (instant recognition):
- Headline ("Cold outside? Warm cappuccino 80m away")
- Benefit ("20% off next 15 min")

Middle area:
- Distance + ETA.
- Why now hint ("quiet hour special")

Bottom area:
- Primary CTA: `Claim Offer`.
- Secondary: `Not now`.
- Expiry timer.

### 12.3 Redemption Flow

- User taps `Claim`.
- App creates dynamic token/QR with short TTL.
- Merchant scanner validates token (simulated).
- Success state: "Redeemed" and optional cashback credit shown.

---

## 13) Prompt and Generation Design

### 13.1 LLM Input Context Bundle

- Merchant constraints (max discount, goal, exclusions).
- Sanitized intent signal.
- Context snapshot (weather/event/time/location cell/demand index).
- Candidate product list and margins (if available).

Suggested request payload:

```json
{
  "request_id": "req_01HXYZ",
  "generation_mode": "offer_card_v1",
  "merchant_profile": {
    "merchant_id": "m_1021",
    "category": "cafe",
    "is_open_now": true,
    "price_band": "mid"
  },
  "constraints": {
    "max_discount_pct": 20,
    "campaign_goal": "fill_quiet_hours",
    "excluded_skus": ["alcohol"],
    "max_validity_minutes": 30
  },
  "intent_packet": {
    "intent_label": "warm_break_seek",
    "intent_confidence": 0.82,
    "receptivity_level": "high",
    "time_budget_minutes": 12,
    "tone_preference": "emotional",
    "hard_constraints": ["vegetarian_only"]
  },
  "context_snapshot": {
    "weather_summary": "11C overcast",
    "demand_gap_pct": 38,
    "event_intensity": "low",
    "local_time_bucket": "lunch"
  },
  "channel_context": {
    "channel": "push",
    "headline_char_limit": 64,
    "body_char_limit": 90
  }
}
```

### 13.2 Canonical Server LLM Output (Single Source of Truth)

Required top-level fields:

- `offer_idempotency_key` (dedupe/retry safety).
- `headline` (channel-safe char limit).
- `body_line`.
- `cta_text`.
- `discount_type` and `discount_value`.
- `valid_for_minutes`.
- `tone_style`.
- `ui_layout_variant`.
- `image_prompt`.
- `justification` (for explainability logs, not always shown to end user).
- `risk_flags` (`needs_human_review`, `safety_notes`).

Optional fields:

- `subheadline`.
- `merchant_disclaimer`.
- `channel_overrides` (push/in-app/widget copy variants).

Suggested response payload:

```json
{
  "offer_idempotency_key": "offer_6f91",
  "headline": "Cold outside? Warm cappuccino 80m away",
  "body_line": "20% off for the next 15 minutes at Cafe Muller.",
  "cta_text": "Claim now",
  "subheadline": "Quiet-hour special nearby",
  "discount_type": "percent",
  "discount_value": 20,
  "valid_for_minutes": 15,
  "tone_style": "emotional",
  "ui_layout_variant": "hero_timer_compact",
  "image_prompt": "cozy cafe interior with warm tones",
  "merchant_disclaimer": "Valid for one redemption per user.",
  "justification": {
    "why_now_factors": [
      "cold_weather",
      "quiet_hour_detected",
      "intent_warm_break_seek"
    ],
    "merchant_goal_alignment": "fill_quiet_hours"
  },
  "channel_overrides": {
    "push": {
      "headline": "Warm cappuccino 80m away",
      "body_line": "20% off, 15 min only."
    },
    "in_app": {
      "headline": "Cold outside? Warm cappuccino nearby",
      "body_line": "Claim 20% off for the next 15 minutes at Cafe Muller."
    }
  },
  "risk_flags": {
    "needs_human_review": false,
    "safety_notes": []
  }
}
```

### 13.3 Guardrails

- JSON schema validation hard fail.
- Numeric caps enforced server-side.
- Fallback deterministic template if LLM fails.

### 13.4 Prompt Strategy and Versioning

- Use separated system and task prompts; never concatenate raw user text.
- Maintain prompt versions (for example `offer_prompt_v1`, `v2`) in config.
- Log `prompt_version`, `model_version`, and validation outcome for each generation.
- Run nightly quality checks on:
  - conversion proxy metrics,
  - policy violation rate,
  - fallback rate.

### 13.5 Observability Metrics for SLM/LLM Layer

Track at minimum:

- `intent_inference_latency_ms` (p50/p95 on device).
- `intent_confidence_distribution` (drift detection).
- `llm_generation_latency_ms` (p50/p95).
- `llm_schema_fail_rate`.
- `llm_policy_reject_rate`.
- `template_fallback_rate`.
- `offer_accept_rate_by_intent_label`.

These metrics are critical for proving reliability in demo Q&A.

---

## 14) Technical Stack Recommendation (Pragmatic)

### Client

- React Native (fast cross-platform demo).
- On-device model:
  - Option A: small local classifier (safest for timing).
  - Option B: tiny SLM via ONNX runtime if team can support.
- Local storage: SQLite/MMKV for consent and local intent history.

### Server

- Node.js + TypeScript + Fastify/Nest.
- PostgreSQL + Redis.
- Queue (BullMQ/SQS equivalent) for generation jobs.
- Analytics pipeline via event table + scheduled aggregations.

### AI

- Server LLM via provider API with JSON mode.
- Prompt versioning to compare generation quality quickly.

---

## 15) Security, Privacy, and GDPR Positioning

1. Data minimization by design.
2. Pseudonymous user IDs only.
3. Consent toggles for each signal category.
4. On-device intent inference preferred for sensitive behavior.
5. Right-to-delete flow for local + server profile.
6. Aggregated merchant analytics; no individual behavior export.

Pitch line: "We do not send who the user is or exactly where they walked; we only send what moment they are in."

---

## 16) Detailed Build Plan (Execution Timeline)

### Phase 0 - Foundation (Half Day)

- Lock architecture and contracts.
- Define JSON schemas for intent, offer, redemption.
- Prepare demo persona and scenario scripts.

### Phase 1 - Context and Trigger Layer (Day 1)

- Integrate weather API + time + geofence + simulated demand feed.
- Build context scorer and trigger threshold logic.
- Create reproducible mock scenario dataset for demo reliability.

### Phase 2 - Intent and Offer Generation (Day 2)

- Implement on-device intent signal generation (rule-based first, model second).
- Implement offer generation orchestrator + guardrails.
- Generate dynamic offer JSON + map to GenUI components.

### Phase 3 - Redemption Loop (Day 3)

- Add accept/dismiss flow.
- Implement QR/token generation + validation simulation.
- Add cashback ledger simulation and success states.

### Phase 4 - Merchant Dashboard (Day 4)

- Build rule editor UI.
- Build KPI overview and funnel panels.
- Add context-performance explanations.

### Phase 5 - Polish and Demo Narrative (Day 5)

- Apply 3-second UX improvements.
- Add privacy explanation overlays.
- Rehearse stable end-to-end flow with fallback paths.

---

## 17) Demo Script (What to Show in 4-6 Minutes)

1. **Problem setup:** Mia scenario (cold, short break, nearby quiet cafe).
2. **Signals panel:** live weather + time + location + low demand indicator.
3. **Intent layer:** show abstract intent generated on device.
4. **Offer generation:** show runtime generated card (copy + discount + timer).
5. **User decision:** accept offer.
6. **Redemption:** scan/validate token, show success.
7. **Merchant side:** show uplift + accept/redeem funnel + trigger explanation.
8. **Privacy statement:** raw personal behavior remains local.

---

## 18) Winning Narrative (Judging Alignment)

Why this stands out:

- Not a coupon catalog; offers are computed per moment.
- Balances AI novelty with clear merchant business value.
- Demonstrates real interaction design, not just model output.
- Shows honest privacy architecture with concrete boundaries.
- Closes supply-demand loop for local commerce.

---

## 19) Risk Register and Mitigations

1. **LLM inconsistency**
   - Mitigation: schema validation + fallback templates.
2. **Data API instability during demo**
   - Mitigation: cache + recorded backup context snapshots.
3. **Overly complex on-device model integration**
   - Mitigation: deterministic local classifier fallback with same output schema.
4. **Redemption flow bugs**
   - Mitigation: deterministic token lifecycle and happy-path rehearsal.
5. **UI clutter violating 3-second rule**
   - Mitigation: strict content budget per card and quick user tests.

---

## 20) Team Operating Model (Who Owns What)

- **Product/UX Lead:** user journey, offer card, merchant UX, demo story.
- **Mobile Engineer:** client app, intent signal module, redemption UI.
- **Backend Engineer:** context ingestion, generation orchestration, APIs.
- **Data/AI Engineer:** scoring logic, prompting, generation quality, KPIs.
- **Presenter/Integrator:** live demo reliability, narrative, fallback control.

---

## 21) Definition of Done (MVP)

Project is done when all are true:

- At least 2 real context signals are visible and active.
- Offer is generated dynamically at runtime for a concrete context.
- User can accept and redeem through simulated checkout/token flow.
- Merchant dashboard shows aggregate metrics + context explanation.
- Privacy architecture is explicitly implemented and explained.
- Full end-to-end demo can be run reliably in under 6 minutes.

