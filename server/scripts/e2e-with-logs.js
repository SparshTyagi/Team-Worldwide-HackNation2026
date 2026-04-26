import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createAppServer } from "../src/index.js";

function isoSafeTimestamp() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

async function requestWithLog({
  baseUrl,
  method,
  path,
  body,
  logDir,
  stepName,
}) {
  const requestLog = {
    method,
    path,
    url: `${baseUrl}${path}`,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ?? null,
    at_utc: new Date().toISOString(),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestLog.headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const rawText = await response.text();

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { raw: rawText };
  }

  const responseLog = {
    status: response.status,
    ok: response.ok,
    body: parsed,
    at_utc: new Date().toISOString(),
  };

  await writeJson(resolve(logDir, `${stepName}.request.json`), requestLog);
  await writeJson(resolve(logDir, `${stepName}.response.json`), responseLog);

  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed (${response.status}): ${JSON.stringify(parsed)}`
    );
  }

  return parsed;
}

async function main() {
  const logsRoot = resolve(process.cwd(), "server", "logs");
  const runDir = resolve(logsRoot, `e2e-${isoSafeTimestamp()}`);
  await mkdir(runDir, { recursive: true });

  const server = createAppServer();
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const address = server.address();
  const port = address && typeof address === "object" ? address.port : 8080;
  const baseUrl = `http://127.0.0.1:${port}`;

  const merchants = [
    {
      merchant_id: "m_3100",
      name: "Green Fork Bistro",
      category: "restaurant",
      area_cell_id: "u0wtm3",
      lat: 48.7765,
      lon: 9.1815,
      is_open_now: true,
      price_band: "mid",
      avg_ticket_size_eur: 14.5,
    },
    {
      merchant_id: "m_3101",
      name: "Stadtbad Sauna Snack",
      category: "wellness_cafe",
      area_cell_id: "u0wtm3",
      lat: 48.778,
      lon: 9.184,
      is_open_now: true,
      price_band: "premium",
      avg_ticket_size_eur: 9.9,
    },
    {
      merchant_id: "m_3102",
      name: "Markthalle Quick Bite",
      category: "fast_casual",
      area_cell_id: "u0wtm6",
      lat: 48.781,
      lon: 9.1785,
      is_open_now: true,
      price_band: "budget",
      avg_ticket_size_eur: 7.25,
    },
  ];

  const user = "usr_logs_demo_001";

  try {
    await requestWithLog({
      baseUrl,
      method: "GET",
      path: "/health",
      logDir: runDir,
      stepName: "01_health",
    });

    for (const [index, merchant] of merchants.entries()) {
      await requestWithLog({
        baseUrl,
        method: "POST",
        path: "/internal/merchants",
        body: merchant,
        logDir: runDir,
        stepName: `0${index + 2}_merchant_upsert_${merchant.merchant_id}`,
      });
    }

    await requestWithLog({
      baseUrl,
      method: "GET",
      path: "/internal/merchants",
      logDir: runDir,
      stepName: "05_merchants_list",
    });

    const intentPacket = {
      intent_id: `intent_${Date.now()}`,
      timestamp_utc: new Date().toISOString(),
      user_pseudonym: user,
      intent_label: "quick_lunch_now",
      intent_confidence: 0.79,
      receptivity_level: "high",
      time_budget_minutes: 20,
      mobility_mode: "walking",
      sensitivity_level: "low",
      tone_preference: "factual",
      hard_constraints: ["vegetarian_only"],
      locality: {
        mode: "radius",
        radius_km: 2,
        center: { lat: 48.7758, lon: 9.1829 },
      },
    };

    await requestWithLog({
      baseUrl,
      method: "POST",
      path: "/v1/intent-signal",
      body: intentPacket,
      logDir: runDir,
      stepName: "06_intent_signal",
    });

    const generated = await requestWithLog({
      baseUrl,
      method: "POST",
      path: "/v1/offer/generate",
      body: {
        intent_packet: intentPacket,
        channel: "in_app",
        prompt_version: "offer_prompt_v1",
      },
      logDir: runDir,
      stepName: "07_offer_generate",
    });

    const active = await requestWithLog({
      baseUrl,
      method: "GET",
      path: `/v1/offers/active?user_pseudonym=${encodeURIComponent(
        user
      )}&channel=in_app`,
      logDir: runDir,
      stepName: "08_offers_active",
    });

    const offerId =
      active.offers?.[0]?.offer_id ?? generated.offer?.offer_idempotency_key;

    const decision = await requestWithLog({
      baseUrl,
      method: "POST",
      path: `/v1/offers/${offerId}/decision`,
      body: {
        user_pseudonym: user,
        decision: "accept",
        decision_timestamp_utc: new Date().toISOString(),
      },
      logDir: runDir,
      stepName: "09_offer_decision",
    });

    const token = await requestWithLog({
      baseUrl,
      method: "POST",
      path: "/v1/redemption/create-token",
      body: {
        offer_id: offerId,
        user_pseudonym: user,
        merchant_id: "m_1021",
        requested_at_utc: new Date().toISOString(),
      },
      logDir: runDir,
      stepName: "10_redemption_create_token",
    });

    await requestWithLog({
      baseUrl,
      method: "POST",
      path: "/v1/redemption/validate",
      body: {
        token: token.token,
        merchant_id: "m_1021",
        validated_at_utc: new Date().toISOString(),
      },
      logDir: runDir,
      stepName: "11_redemption_validate",
    });

    const wallet = await requestWithLog({
      baseUrl,
      method: "GET",
      path: `/v1/wallet/cashback?user_pseudonym=${encodeURIComponent(user)}`,
      logDir: runDir,
      stepName: "12_wallet_cashback",
    });

    const overview = await requestWithLog({
      baseUrl,
      method: "GET",
      path: "/v1/merchant/dashboard/overview?merchant_id=m_1021",
      logDir: runDir,
      stepName: "13_merchant_dashboard_overview",
    });

    const summary = {
      ok: true,
      log_directory: runDir,
      base_url: baseUrl,
      user_pseudonym: user,
      offer_id: offerId,
      decision_status: decision.status,
      cashback_balance_eur: wallet.cashback_balance_eur,
      merchant_offers_generated: overview.kpis?.offers_generated ?? null,
      generated_used_fallback: generated.used_fallback,
      completed_at_utc: new Date().toISOString(),
    };
    await writeJson(resolve(runDir, "summary.json"), summary);

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

main().catch((error) => {
  console.error("E2E with logs failed:", error.message);
  process.exit(1);
});
