"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { fallbackOfferFromIntent } = require("../orchestration/fallback.js");

test("fallback offer maps known intent copy", () => {
  const offer = fallbackOfferFromIntent({ intent_label: "quick_lunch_now" });
  assert.equal(offer.headline, "Quick lunch deal close to you");
  assert.equal(offer.model_version, "fallback-template-v1");
});

test("fallback offer returns generic copy for unknown intent", () => {
  const offer = fallbackOfferFromIntent({ intent_label: "unknown_intent" });
  assert.equal(offer.headline, "Nearby local offer available");
  assert.equal(typeof offer.offer_idempotency_key, "string");
});
