"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ClientBrain } = require("../orchestration/brain.js");
const { SecureStore } = require("../storage/secure-store.js");

test("client brain integration uses fallback when proxy fails", async () => {
  const brain = new ClientBrain({
    secureStore: new SecureStore(),
    proxyConfig: {
      baseUrl: "http://127.0.0.1:1",
      authToken: "invalid",
    },
  });

  const intentPacket = await brain.buildIntentPacket({
    userPseudonym: "usr_int_1",
    consentMask: {
      precise_location: false,
      background_location: false,
      learn_from_accepted_offers: true,
      learn_from_dismissed_offers: true,
      learn_from_redeemed_offers: true,
      push_notifications: false,
      anonymous_merchant_analytics: true,
    },
    profile: {
      offer_tone: "friendly",
      hard_constraints: ["no_alcohol"],
      time_budget_minutes: 10,
    },
    rawFeatures: {
      lat: 48.7,
      lon: 9.1,
      speed_mps: 0.4,
      stop_count_15m: 3,
      weather_summary: "cold rain",
      nearby_merchant_ids: ["m1"],
    },
    interactionStats: {
      delivered_count_7d: 5,
      dismiss_count_7d: 1,
      accept_count_7d: 2,
    },
  });

  const offer = await brain.generateOffer({ intentPacket });
  assert.equal(offer.model_version, "fallback-template-v1");
  assert.equal(typeof offer.offer_idempotency_key, "string");
  assert.equal(offer.headline.length <= 64, true);

  const event = await brain.createDecisionEvent({
    offerId: offer.offer_idempotency_key,
    userPseudonym: "usr_int_1",
    decision: "dismiss",
  });

  assert.equal(event.prompt_version, "offer_prompt_v1");
});
