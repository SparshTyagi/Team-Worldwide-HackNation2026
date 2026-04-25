"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateIntentPacket,
  validateOfferCard,
  validateDecisionEvent,
} = require("../contracts/schemas.js");

test("validateIntentPacket accepts valid payload", () => {
  const packet = {
    intent_id: "intent_1",
    timestamp_utc: new Date().toISOString(),
    user_pseudonym: "usr_1",
    intent_label: "warm_break_seek",
    intent_confidence: 0.8,
    receptivity_level: "high",
    time_budget_minutes: 12,
    mobility_mode: "walking",
    sensitivity_level: "medium",
    tone_preference: "friendly",
    hard_constraints: ["no_alcohol"],
    locality: { radius_km: 2, area_cell_ids: ["48.78:9.18"] },
  };
  assert.doesNotThrow(() => validateIntentPacket(packet));
});

test("validateOfferCard rejects invalid lengths", () => {
  const invalid = {
    offer_idempotency_key: "offer_1",
    headline: "x".repeat(65),
    body_line: "short",
    cta_text: "Claim",
    discount_type: "percent",
    discount_value: 10,
    valid_for_minutes: 10,
    tone_style: "friendly",
  };
  assert.throws(() => validateOfferCard(invalid));
});

test("validateDecisionEvent accepts valid decision event", () => {
  const event = {
    event_id: "evt_1",
    offer_id: "offer_1",
    user_pseudonym: "usr_1",
    timestamp_utc: new Date().toISOString(),
    decision: "accept",
    model_version: "nvidia/nemotron-3-super:free",
    prompt_version: "offer_prompt_v1",
  };
  assert.doesNotThrow(() => validateDecisionEvent(event));
});
