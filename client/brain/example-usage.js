"use strict";

const { ClientBrain, SecureStore } = require("./index.js");

async function postIntentSignal({ baseUrl, authToken, intentPacket }) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${baseUrl}/v1/intent-signal`, {
    method: "POST",
    headers,
    body: JSON.stringify(intentPacket),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`/v1/intent-signal failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function fetchActiveOffers({ baseUrl, authToken, userPseudonym }) {
  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(
    `${baseUrl}/v1/offers/active?user_pseudonym=${encodeURIComponent(userPseudonym)}&channel=in_app`,
    { method: "GET", headers },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`/v1/offers/active failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function run() {
  const userPseudonym = "usr_demo_001";
  const brain = new ClientBrain({
    secureStore: new SecureStore(),
    proxyConfig: {
      baseUrl: process.env.BRAIN_PROXY_BASE_URL || "http://localhost:8080",
      authToken: process.env.BRAIN_PROXY_AUTH_TOKEN,
    },
  });

  const intentPacket = await brain.buildIntentPacket({
    userPseudonym,
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

  const intentAck = await postIntentSignal({
    baseUrl: brain.proxyConfig.baseUrl,
    authToken: brain.proxyConfig.authToken,
    intentPacket,
  });

  const offer = await brain.generateOffer({ intentPacket });
  const activeOffers = await fetchActiveOffers({
    baseUrl: brain.proxyConfig.baseUrl,
    authToken: brain.proxyConfig.authToken,
    userPseudonym,
  });
  const decision = await brain.createDecisionEvent({
    offerId: offer.offer_idempotency_key,
    userPseudonym,
    decision: "accept",
  });

  console.log("Intent ack:", intentAck);
  console.log("Intent packet:", intentPacket);
  console.log("Offer:", offer);
  console.log("Active offers:", activeOffers);
  console.log("Decision event:", decision);
  console.log("Metrics:", brain.getMetricsSnapshot());
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
