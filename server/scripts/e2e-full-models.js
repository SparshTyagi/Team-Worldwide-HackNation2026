import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { createAppServer } from "../src/index.js";

const require = createRequire(import.meta.url);
const { ClientBrain, SecureStore } = require("../../client/src/modules/user/index.js");

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
  scenarioName,
  stepName,
}) {
  const requestLog = {
    scenario: scenarioName,
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
    scenario: scenarioName,
    status: response.status,
    ok: response.ok,
    body: parsed,
    at_utc: new Date().toISOString(),
  };

  await writeJson(resolve(logDir, `${scenarioName}.${stepName}.request.json`), requestLog);
  await writeJson(resolve(logDir, `${scenarioName}.${stepName}.response.json`), responseLog);

  if (!response.ok) {
    throw new Error(
      `${scenarioName} ${method} ${path} failed (${response.status}): ${JSON.stringify(parsed)}`
    );
  }

  return parsed;
}

async function ensureLocalIntentModel(logDir) {
  const body = {
    model: process.env.OLLAMA_INTENT_MODEL || "nemotron-3-nano:4b",
    stream: false,
    messages: [{ role: "user", content: "Reply exactly with: local intent model ready" }],
  };
  const response = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  let parsed = { raw };
  try {
    parsed = JSON.parse(raw);
  } catch {
    // keep raw
  }
  await writeJson(resolve(logDir, "00.local-intent-model.check.request.json"), body);
  await writeJson(resolve(logDir, "00.local-intent-model.check.response.json"), parsed);
  if (!response.ok) {
    throw new Error(`Local intent model check failed: ${raw}`);
  }
}

async function buildIntentPacketForScenario({ scenario, baseUrl }) {
  process.env.INTENT_MODEL_PROVIDER = "ollama";
  process.env.OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  process.env.OLLAMA_INTENT_MODEL = process.env.OLLAMA_INTENT_MODEL || "nemotron-3-nano:4b";

  const brain = new ClientBrain({
    secureStore: new SecureStore(),
    proxyConfig: { baseUrl },
  });

  return brain.buildIntentPacket({
    userPseudonym: scenario.user_pseudonym,
    consentMask: scenario.consentMask,
    profile: scenario.profile,
    rawFeatures: scenario.rawFeatures,
    interactionStats: scenario.interactionStats,
  });
}

async function main() {
  const logsRoot = resolve(process.cwd(), "server", "logs");
  const runDir = resolve(logsRoot, `e2e-full-models-${isoSafeTimestamp()}`);
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
      cuisine: "healthy",
      discount_events: ["weekday_lunch", "conference_days"],
      dietary_restrictions: ["vegetarian", "nut_free", "halal"],
      hours: ["Mon-Fri 11:00-21:00", "Sat-Sun 12:00-22:00"],
      max_discount_value: 20,
      budget: 120,
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
      cuisine: "cafe",
      discount_events: ["morning_rush", "post_gym"],
      dietary_restrictions: ["vegan", "dairy_free", "low_sugar"],
      hours: ["Mon-Sun 08:00-20:00"],
      max_discount_value: 15,
      budget: 90,
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
      cuisine: "japanese",
      discount_events: ["market_day", "late_lunch"],
      dietary_restrictions: ["halal", "vegetarian"],
      hours: ["Mon-Fri 10:00-19:00", "Sat 10:00-16:00"],
      max_discount_value: 10,
      budget: 80,
      area_cell_id: "u0wtm6",
      lat: 48.781,
      lon: 9.1785,
      is_open_now: true,
      price_band: "budget",
      avg_ticket_size_eur: 7.25,
    },
  ];

  const scenarios = [
    {
      name: "scenario_a_lunch_rain",
      user_pseudonym: "usr_full_models_001",
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
        offer_tone: "factual",
        hard_constraints: ["max_spend_20"],
        time_budget_minutes: 18,
        home_location: { lat: 48.765, lon: 9.162, label: "home_south" },
        work_location: { lat: 48.779, lon: 9.176, label: "design_studio" },
        usual_meal_times: { coffee: "09:20", lunch: "12:40", dinner: "20:00" },
        food_preferences: {
          coffee: false,
          bakery: false,
          ramen: true,
          salads: true,
          wine_bars: false,
          gelato: false,
        },
        dietary_restrictions: ["halal", "nut_free"],
        preferred_cuisines: ["japanese", "healthy"],
      },
      rawFeatures: {
        now: new Date("2026-04-27T12:41:00+10:00"),
        lat: 48.7785,
        lon: 9.1773,
        speed_mps: 0.7,
        stop_count_15m: 2,
        weather_summary: "steady rain and windy",
        temperature_c: 11,
        event_intensity: "medium",
        events: [{ title: "Startup Expo Lunch Rush", category: "conference" }],
        nearby_merchant_ids: ["m_3100", "m_3102"],
      },
      interactionStats: {
        delivered_count_7d: 14,
        dismiss_count_7d: 3,
        accept_count_7d: 6,
      },
    },
    {
      name: "scenario_b_evening_events",
      user_pseudonym: "usr_full_models_002",
      consentMask: {
        precise_location: true,
        background_location: true,
        learn_from_accepted_offers: true,
        learn_from_dismissed_offers: true,
        learn_from_redeemed_offers: true,
        push_notifications: true,
        anonymous_merchant_analytics: true,
      },
      profile: {
        offer_tone: "playful",
        hard_constraints: ["avoid_high_sugar"],
        time_budget_minutes: 28,
        home_location: { lat: 48.7862, lon: 9.195, label: "north_home" },
        work_location: { lat: 48.781, lon: 9.173, label: "cowork" },
        usual_meal_times: { coffee: "10:00", lunch: "13:10", dinner: "19:45" },
        food_preferences: {
          coffee: false,
          bakery: true,
          ramen: false,
          salads: false,
          wine_bars: true,
          gelato: true,
        },
        dietary_restrictions: ["low_sugar"],
        preferred_cuisines: ["wine_bar", "dessert", "cafe"],
      },
      rawFeatures: {
        now: new Date("2026-05-02T19:18:00+10:00"),
        lat: 48.7803,
        lon: 9.1858,
        speed_mps: 0.2,
        stop_count_15m: 4,
        weather_summary: "clear mild evening",
        temperature_c: 21,
        event_intensity: "high",
        events: [
          { title: "Riverside Live Music", category: "music" },
          { title: "Night Market", category: "market" },
        ],
        nearby_merchant_ids: ["m_3101", "m_3100"],
      },
      interactionStats: {
        delivered_count_7d: 8,
        dismiss_count_7d: 1,
        accept_count_7d: 4,
      },
    },
  ];

  try {
    await ensureLocalIntentModel(runDir);

    await requestWithLog({
      baseUrl,
      method: "GET",
      path: "/health",
      logDir: runDir,
      scenarioName: "global",
      stepName: "01.health",
    });

    for (const merchant of merchants) {
      await requestWithLog({
        baseUrl,
        method: "POST",
        path: "/internal/merchants",
        body: merchant,
        logDir: runDir,
        scenarioName: "global",
        stepName: `02.upsert.${merchant.merchant_id}`,
      });
    }

    const scenarioSummaries = [];

    for (const scenario of scenarios) {
      const intentPacket = await buildIntentPacketForScenario({ scenario, baseUrl });
      await writeJson(resolve(runDir, `${scenario.name}.03.intent-packet.generated.json`), intentPacket);

      const merchantsBefore = await requestWithLog({
        baseUrl,
        method: "GET",
        path: "/internal/merchants",
        logDir: runDir,
        scenarioName: scenario.name,
        stepName: "04.merchants.before",
      });

      await requestWithLog({
        baseUrl,
        method: "POST",
        path: "/v1/intent-signal",
        body: intentPacket,
        logDir: runDir,
        scenarioName: scenario.name,
        stepName: "05.intent-signal",
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
        scenarioName: scenario.name,
        stepName: "06.offer-generate",
      });

      const active = await requestWithLog({
        baseUrl,
        method: "GET",
        path: `/v1/offers/active?user_pseudonym=${encodeURIComponent(
          scenario.user_pseudonym
        )}&channel=in_app`,
        logDir: runDir,
        scenarioName: scenario.name,
        stepName: "07.offers-active",
      });

      const offerId = active.offers?.[0]?.offer_id ?? generated.offer?.offer_idempotency_key;
      const offerMerchantId = active.offers?.[0]?.merchant_id ?? merchants[0].merchant_id;

      await requestWithLog({
        baseUrl,
        method: "POST",
        path: `/v1/offers/${offerId}/decision`,
        body: {
          user_pseudonym: scenario.user_pseudonym,
          decision: "accept",
          decision_timestamp_utc: new Date().toISOString(),
        },
        logDir: runDir,
        scenarioName: scenario.name,
        stepName: "08.offer-decision",
      });

      const token = await requestWithLog({
        baseUrl,
        method: "POST",
        path: "/v1/redemption/create-token",
        body: {
          offer_id: offerId,
          user_pseudonym: scenario.user_pseudonym,
          merchant_id: offerMerchantId,
          requested_at_utc: new Date().toISOString(),
        },
        logDir: runDir,
        scenarioName: scenario.name,
        stepName: "09.redemption-create-token",
      });

      const redemptionValidation = await requestWithLog({
        baseUrl,
        method: "POST",
        path: "/v1/redemption/validate",
        body: {
          token: token.token,
          merchant_id: offerMerchantId,
          validated_at_utc: new Date().toISOString(),
        },
        logDir: runDir,
        scenarioName: scenario.name,
        stepName: "10.redemption-validate",
      });

      const merchantsAfter = await requestWithLog({
        baseUrl,
        method: "GET",
        path: "/internal/merchants",
        logDir: runDir,
        scenarioName: scenario.name,
        stepName: "11.merchants.after",
      });

      const wallet = await requestWithLog({
        baseUrl,
        method: "GET",
        path: `/v1/wallet/cashback?user_pseudonym=${encodeURIComponent(scenario.user_pseudonym)}`,
        logDir: runDir,
        scenarioName: scenario.name,
        stepName: "12.wallet-cashback",
      });

      scenarioSummaries.push({
        scenario: scenario.name,
        user_pseudonym: scenario.user_pseudonym,
        model_generated_intent_label: intentPacket.intent_label,
        offer_used_fallback: generated.used_fallback,
        offer_model_version: generated.model_version,
        redemption_token_prefix: String(token.token).slice(0, 12),
        merchant_budget_update: redemptionValidation.merchant_budget ?? null,
        wallet_cashback_balance_eur: wallet.cashback_balance_eur,
        merchants_before_count: merchantsBefore.merchants?.length ?? 0,
        merchants_after_count: merchantsAfter.merchants?.length ?? 0,
      });
    }

    const summary = {
      ok: true,
      base_url: baseUrl,
      log_directory: runDir,
      scenarios: scenarioSummaries,
      completed_at_utc: new Date().toISOString(),
    };
    await writeJson(resolve(runDir, "summary.json"), summary);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

main().catch((error) => {
  console.error("E2E full models run failed:", error.message);
  process.exit(1);
});
