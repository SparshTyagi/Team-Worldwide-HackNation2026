"use strict";

const { ClientBrain, SecureStore } = require("./index.js");

async function run() {
  const brain = new ClientBrain({
    secureStore: new SecureStore(),
    proxyConfig: {
      baseUrl: process.env.BRAIN_PROXY_BASE_URL || "http://localhost:8787",
      authToken: process.env.BRAIN_PROXY_AUTH_TOKEN || "demo-token",
    },
  });

  const intentPacket = await brain.buildIntentPacket({
    userPseudonym: "usr_demo_001",
    consentMask: {
      precise_location: true,
      background_location: false,
      learn_from_accepted_offers: true,
      learn_from_dismissed_offers: true,
      learn_from_redeemed_offers: true,
      push_notifications: true,
      anonymous_merchant_analytics: true,
    },
    profile: {
      interests: ["coffee", "lunch"],
      offer_tone: "friendly",
      hard_constraints: ["no_alcohol"],
      time_budget_minutes: 12,
    },
    rawFeatures: {
      lat: 48.7758,
      lon: 9.1829,
      speed_mps: 1.2,
      stop_count_15m: 2,
      weather_summary: "11C cold and cloudy",
      nearby_merchant_ids: ["m_1021", "m_4201"],
    },
    interactionStats: {
      delivered_count_7d: 12,
      dismiss_count_7d: 3,
      accept_count_7d: 5,
    },
  });

  const offer = await brain.generateOffer({ intentPacket });
  const decision = await brain.createDecisionEvent({
    offerId: offer.offer_idempotency_key,
    userPseudonym: "usr_demo_001",
    decision: "accept",
  });

  console.log("Intent packet:", intentPacket);
  console.log("Offer:", offer);
  console.log("Decision event:", decision);
  console.log("Metrics:", brain.getMetricsSnapshot());
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
