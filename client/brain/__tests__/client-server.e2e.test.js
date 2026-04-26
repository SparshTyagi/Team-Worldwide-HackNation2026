"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { ClientBrain } = require("../orchestration/brain.js");
const { SecureStore } = require("../storage/secure-store.js");

async function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function startServer() {
  const serverEntry = path.resolve(__dirname, "../../../server/src/index.js");
  const moduleUrl = pathToFileURL(serverEntry).href;
  const { createAppServer } = await import(moduleUrl);
  const server = createAppServer();

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address !== "object") {
      throw new Error("Could not resolve test server address");
    }
    const baseUrl = `http://127.0.0.1:${address.port}`;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const res = await fetchWithTimeout(`${baseUrl}/health`, {}, 700);
        if (res.ok) {
          return { server, baseUrl };
        }
      } catch {
        // Server still starting up.
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error("Timed out waiting for test server health");
  } catch (error) {
    await stopServer(server);
    throw error;
  }
}

async function stopServer(server) {
  if (!server || !server.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function postJson(url, body) {
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    2500,
  );
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`POST ${url} failed (${res.status}): ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

async function getJson(url) {
  const res = await fetchWithTimeout(url, {}, 2500);
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`GET ${url} failed (${res.status}): ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

test("client brain generates offer against live server", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const brain = new ClientBrain({
      secureStore: new SecureStore(),
      proxyConfig: { baseUrl },
    });

    const intentPacket = await brain.buildIntentPacket({
      userPseudonym: "usr_e2e_client_1",
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
        interests: ["coffee"],
        offer_tone: "friendly",
        hard_constraints: ["no_alcohol"],
        time_budget_minutes: 12,
      },
      rawFeatures: {
        lat: 48.7758,
        lon: 9.1829,
        speed_mps: 1.1,
        stop_count_15m: 2,
        weather_summary: "cold and cloudy",
        nearby_merchant_ids: ["m_1021"],
      },
      interactionStats: {
        delivered_count_7d: 8,
        dismiss_count_7d: 1,
        accept_count_7d: 4,
      },
    });

    const intentAck = await postJson(`${baseUrl}/v1/intent-signal`, intentPacket);
    assert.equal(intentAck.status, "accepted");
    assert.equal(typeof intentAck.intent_id, "string");
    assert.equal(intentAck.intent_id.length > 0, true);

    const offer = await brain.generateOffer({ intentPacket });
    assert.equal(typeof offer.offer_idempotency_key, "string");
    assert.equal(offer.headline.length <= 64, true);
    assert.equal(offer.body_line.length <= 90, true);
    assert.equal(typeof offer.model_version, "string");
    assert.equal(typeof offer.prompt_version, "string");
  } finally {
    await stopServer(server);
  }
});

test("server offer lifecycle works end-to-end", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const user = "usr_e2e_server_1";

    const intentPacket = {
      intent_id: `intent_${Date.now()}`,
      timestamp_utc: new Date().toISOString(),
      user_pseudonym: user,
      intent_label: "quick_lunch_now",
      intent_confidence: 0.81,
      receptivity_level: "high",
      time_budget_minutes: 15,
      mobility_mode: "walking",
      sensitivity_level: "low",
      tone_preference: "friendly",
      hard_constraints: ["no_alcohol"],
      locality: { area_cell_ids: ["u0wtm3"] },
    };

    await postJson(`${baseUrl}/v1/intent-signal`, intentPacket);

    const generated = await postJson(`${baseUrl}/v1/offer/generate`, {
      intent_packet: intentPacket,
      channel: "in_app",
      prompt_version: "offer_prompt_v1",
    });
    assert.equal(typeof generated.offer.offer_idempotency_key, "string");
    assert.equal(typeof generated.used_fallback, "boolean");

    const active = await getJson(
      `${baseUrl}/v1/offers/active?user_pseudonym=${encodeURIComponent(user)}&channel=in_app`,
    );
    assert.equal(Array.isArray(active.offers), true);
    assert.equal(active.offers.length > 0, true);
    assert.equal(typeof active.offers[0].offer_id, "string");
    assert.equal(active.offers[0].offer_id.length > 0, true);
    const offerId = active.offers[0].offer_id;

    const decision = await postJson(`${baseUrl}/v1/offers/${offerId}/decision`, {
      user_pseudonym: user,
      decision: "accept",
      decision_timestamp_utc: new Date().toISOString(),
    });
    assert.equal(decision.status, "recorded");
    assert.equal(decision.decision, "accept");

    const token = await postJson(`${baseUrl}/v1/redemption/create-token`, {
      offer_id: offerId,
      user_pseudonym: user,
      merchant_id: "m_1021",
      requested_at_utc: new Date().toISOString(),
    });
    assert.equal(typeof token.token, "string");
    assert.equal(token.ttl_seconds, 180);

    const validation = await postJson(`${baseUrl}/v1/redemption/validate`, {
      token: token.token,
      merchant_id: "m_1021",
      validated_at_utc: new Date().toISOString(),
    });
    assert.equal(validation.is_valid, true);
    assert.equal(validation.cashback_credited_eur > 0, true);

    const wallet = await getJson(
      `${baseUrl}/v1/wallet/cashback?user_pseudonym=${encodeURIComponent(user)}`,
    );
    assert.equal(wallet.user_pseudonym, user);
    assert.equal(wallet.cashback_balance_eur > 0, true);
  } finally {
    await stopServer(server);
  }
});
