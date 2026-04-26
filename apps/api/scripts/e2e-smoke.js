const BASE_URL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:8080";

async function req(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

async function run() {
  const user = "usr_smoke_001";
  const runId = Date.now();
  const intentPacket = {
    intent_id: `intent_smoke_${runId}`,
    timestamp_utc: new Date().toISOString(),
    user_pseudonym: user,
    intent_label: "warm_break_seek",
    intent_confidence: 0.82,
    receptivity_level: "high",
    time_budget_minutes: 12,
    mobility_mode: "walking",
    sensitivity_level: "low",
    tone_preference: "factual",
    hard_constraints: ["no_alcohol"],
    locality: {
      area_cell_ids: ["u0wtm3"],
    },
  };

  await req("/v1/intent-signal", { method: "POST", body: intentPacket });

  const generated = await req("/v1/offer/generate", {
    method: "POST",
    body: {
      intent_packet: intentPacket,
      channel: "in_app",
      prompt_version: "offer_prompt_v1",
    },
  });

  const active = await req(
    `/v1/offers/active?user_pseudonym=${encodeURIComponent(user)}&channel=in_app`
  );
  const offerId = active.offers?.[0]?.offer_id || generated.offer?.offer_idempotency_key;
  const offerMerchantId = active.offers?.[0]?.merchant_id || "m_1021";
  if (!offerId) {
    throw new Error("No offer_id returned from generation/feed");
  }

  await req(`/v1/offers/${offerId}/decision`, {
    method: "POST",
    body: {
      user_pseudonym: user,
      decision: "accept",
      decision_timestamp_utc: new Date().toISOString(),
    },
  });

  const token = await req("/v1/redemption/create-token", {
    method: "POST",
    body: {
      offer_id: offerId,
      user_pseudonym: user,
      merchant_id: offerMerchantId,
      requested_at_utc: new Date().toISOString(),
    },
  });

  await req("/v1/redemption/validate", {
    method: "POST",
    body: {
      token: token.token,
      merchant_id: offerMerchantId,
      validated_at_utc: new Date().toISOString(),
    },
  });

  const merchantRegister = await req("/auth/register", {
    method: "POST",
    body: {
      email: `merchant_smoke_${runId}@example.com`,
      password: `Passw0rd!${runId}`,
      role: "merchant",
      display_name: "Smoke Merchant",
      business_category: "cafe",
    },
  });

  const merchantToken = merchantRegister.session?.access_token;
  const merchantId = merchantRegister.merchant_id;

  await req("/internal/merchants/approval", {
    method: "POST",
    body: {
      merchant_id: merchantId,
      decision: "approved",
      reviewed_by: "smoke-script",
      notes: "Approved by smoke:e2e script",
    },
  });

  const wallet = await req(`/v1/wallet/cashback?user_pseudonym=${encodeURIComponent(user)}`);
  const overview = await req(`/v1/merchant/dashboard/overview?merchant_id=${merchantId}`, {
    token: merchantToken,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        base_url: BASE_URL,
        offer_id: offerId,
        cashback_balance_eur: wallet.cashback_balance_eur,
        merchant_offers_generated: overview.kpis.offers_generated,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error("E2E smoke failed:", error.message);
  process.exit(1);
});
