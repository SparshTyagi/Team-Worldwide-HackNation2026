/**
 * e2e-supabase.js
 * End-to-end test for the Supabase-backed server.
 * Runs the full funnel: merchant seed → intent → offer → decision → QR → validate → cashback → dashboard.
 *
 * Usage: node scripts/e2e-supabase.js
 * Requires the server to be running on PORT 8080 (npm run dev).
 */

const BASE = `http://localhost:${process.env.PORT || 8080}`;
let passed = 0;
let failed = 0;

async function req(method, path, body, token = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

function check(label, res, expectedStatus, validator) {
  const statusOk = res.status === expectedStatus;
  const validatorOk = validator ? validator(res.data) : true;
  if (statusOk && validatorOk) {
    console.log(`  ✅ ${label}`);
    passed++;
    return true;
  } else {
    console.log(`  ❌ ${label}`);
    if (!statusOk) console.log(`     Expected HTTP ${expectedStatus}, got ${res.status}`);
    if (!validatorOk) console.log(`     Payload:`, JSON.stringify(res.data, null, 2));
    failed++;
    return false;
  }
}

async function run() {
  console.log("\n🏙️  Generative City Wallet — Supabase E2E Test\n");

  // ── 1. Health ──────────────────────────────────────────────────────────────
  console.log("1. Health check");
  const health = await req("GET", "/health");
  check("Server is up", health, 200, (d) => d.ok === true);

  // ── 2. Context Ingestion ───────────────────────────────────────────────────
  console.log("\n2. Context ingestion");

  const weatherRes = await req("POST", "/internal/context/ingest/weather", {
    city: "Stuttgart",
    area_cell_id: "u0wtm3",
    observed_at_utc: new Date().toISOString(),
    weather_summary: "Light rain, 14°C",
    temperature_c: 14,
    precipitation_mm: 2.4,
    condition: "rainy",
  });
  check("Ingest weather", weatherRes, 200, (d) => d.status === "ingested");

  const eventsRes = await req("POST", "/internal/context/ingest/events", {
    city: "Stuttgart",
    area_cell_id: "u0wtm3",
    observed_at_utc: new Date().toISOString(),
    event_intensity: "medium",
    events: [
      {
        event_id: "evt_001",
        title: "Stuttgart Jazz Night",
        category: "music",
        start_utc: new Date().toISOString(),
        end_utc: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      },
    ],
  });
  check("Ingest events", eventsRes, 200, (d) => d.status === "ingested");

  // ── 2b. Merchant Auth ──────────────────────────────────────────────────────
  console.log("\n2b. Merchant Auth");
  let merchantToken = null;
  let actualMerchantId = "m_e2e_01";
  
  const credentials = {
    email: `e2e_merchant_fixed_${Date.now()}@gmail.com`,
    password: "password123",
  };

  let authRes = await req("POST", "/auth/register", {
    ...credentials,
    role: "merchant",
    display_name: "E2E Test Cafe",
  });

  if (authRes.status !== 201) {
    console.log("     Registration failed (likely rate limit or duplicate), falling back to login...");
    authRes = await req("POST", "/auth/login", credentials);
    check("Login merchant fallback", authRes, 200, (d) => !!d.session?.access_token);
  } else {
    check("Register merchant", authRes, 201, (d) => !!d.session?.access_token);
  }
  
  merchantToken = authRes.data?.session?.access_token;
  actualMerchantId = authRes.data?.merchant_id || authRes.data?.user?.user_metadata?.merchant_id || "m_e2e_01";

  // ── 3. Merchant Upsert ─────────────────────────────────────────────────────
  console.log("\n3. Merchant seed");

  const merchantRes = await req("POST", "/internal/merchants", {
    merchant_id: actualMerchantId || "m_e2e_01",
    name: "E2E Test Cafe",
    category: "cafe",
    area_cell_id: "u0wtm3",
    lat: 48.7758,
    lon: 9.1829,
    is_open_now: true,
    price_band: "mid",
    avg_ticket_size_eur: 9.5,
  });
  check("Upsert merchant", merchantRes, 200, (d) => d.status === "upserted");

  // ── 4. Merchant Rules ──────────────────────────────────────────────────────
  console.log("\n4. Merchant rules");
  const rulesRes = await req("POST", "/v1/merchant/rules", {
    merchant_id: actualMerchantId || "m_e2e_01",
    campaign_goal: "fill_quiet_hours",
    constraints: {
      max_discount_pct: 20,
      max_offer_validity_minutes: 15,
      excluded_skus: [],
    },
  }, merchantToken);
  check("Create merchant rules", rulesRes, 200, (d) => d.status === "active");

  // ── 5. List Merchants ──────────────────────────────────────────────────────
  console.log("\n5. List merchants");
  const listRes = await req("GET", "/internal/merchants");
  check("List merchants returns array", listRes, 200, (d) => Array.isArray(d.merchants));
  check("Seeded merchant is present", listRes, 200, (d) =>
    d.merchants.some((m) => m.name === "E2E Test Cafe")
  );

  // ── 6. Intent Signal ──────────────────────────────────────────────────────
  console.log("\n6. Intent signal");
  const intentRes = await req("POST", "/v1/intent-signal", {
    user_pseudonym: "e2e_user_test_01",
    intent_label: "warm_break_seek",
    intent_confidence: 0.82,
    receptivity_level: "high",
    time_budget_minutes: 15,
    tone_preference: "friendly",
    hard_constraints: [],
    locality: {
      mode: "radius",
      radius_km: 2,
      center: { lat: 48.7758, lon: 9.1829 },
    },
  });
  check("Intent accepted", intentRes, 200, (d) => d.status === "accepted");

  // ── 7. Offer Generation ────────────────────────────────────────────────────
  console.log("\n7. Offer generation (LLM call — may take a few seconds)");
  const offerGenRes = await req("POST", "/v1/offer/generate", {
    intent_packet: {
      intent_label: "warm_break_seek",
      intent_confidence: 0.82,
      receptivity_level: "high",
      time_budget_minutes: 15,
      tone_preference: "friendly",
      hard_constraints: [],
    },
    channel: "in_app",
  });
  const offerOk = check("Generate offer", offerGenRes, 200, (d) => d.offer?.headline);
  if (!offerOk) {
    console.log("     Cannot proceed without an offer. Aborting remaining tests.");
    printSummary(); return;
  }

  const offerId = offerGenRes.data.offer?.offer_idempotency_key;
  console.log(`     Offer ID: ${offerId}`);

  // ── 8. Active Offers ───────────────────────────────────────────────────────
  console.log("\n8. Active offers");
  const activeRes = await req("GET", "/v1/offers/active?user_pseudonym=e2e_user_test_01&channel=in_app");
  check("Active offers list returns", activeRes, 200, (d) => Array.isArray(d.offers) && d.offers.length > 0);
  const activeOfferId = activeRes.data.offers?.[0]?.offer_id;
  console.log(`     Active offer DB id: ${activeOfferId}`);

  // ── 9. Decision ────────────────────────────────────────────────────────────
  console.log("\n9. Offer decision");
  const decisionRes = await req("POST", `/v1/offers/${activeOfferId}/decision`, {
    user_pseudonym: "e2e_user_test_01",
    decision: "accept",
  });
  check("Accept decision recorded", decisionRes, 200, (d) => d.decision === "accept");

  // ── 10. Create Redemption Token ────────────────────────────────────────────
  console.log("\n10. Redemption token (QR code)");
  const tokenRes = await req("POST", "/v1/redemption/create-token", {
    offer_id: activeOfferId,
    user_pseudonym: "e2e_user_test_01",
    merchant_id: "m_e2e_01",
  });
  check("Token created", tokenRes, 200, (d) => typeof d.token === "string");
  check("QR data URI present", tokenRes, 200, (d) => d.qr_payload?.startsWith("data:image/png;base64,"));

  const token = tokenRes.data.token;
  console.log(`     Token: ${token?.slice(0, 20)}...`);

  // ── 11. Validate Redemption ────────────────────────────────────────────────
  console.log("\n11. Redemption validation");
  const validateRes = await req("POST", "/v1/redemption/validate", {
    token,
  });
  check("Token valid", validateRes, 200, (d) => d.is_valid === true);
  check("Cashback credited", validateRes, 200, (d) => d.cashback_credited_eur > 0);

  // ── 12. Double-Spend Prevention ────────────────────────────────────────────
  console.log("\n12. Double-spend prevention");
  const doubleSpendRes = await req("POST", "/v1/redemption/validate", {
    token,
  });
  check("Second redemption rejected", doubleSpendRes, 400, (d) => !!d.error);

  // ── 13. Cashback Balance ───────────────────────────────────────────────────
  console.log("\n13. Wallet cashback");
  const cashbackRes = await req("GET", "/v1/wallet/cashback?user_pseudonym=e2e_user_test_01");
  check("Cashback balance correct", cashbackRes, 200, (d) => d.cashback_balance_eur >= 0.75);

  // ── 14. Dashboard Overview ─────────────────────────────────────────────────
  console.log("\n14. Dashboard overview");
  const dashRes = await req("GET", `/v1/merchant/dashboard/overview?merchant_id=${actualMerchantId || "m_e2e_01"}`, null, merchantToken);
  check("Dashboard overview", dashRes, 200, (d) => typeof d.kpis?.offers_generated === "number");

  // ── 15. Dashboard Funnel ───────────────────────────────────────────────────
  console.log("\n15. Dashboard funnel");
  const funnelRes = await req("GET", `/v1/merchant/dashboard/funnel?merchant_id=${actualMerchantId || "m_e2e_01"}`, null, merchantToken);
  check("Dashboard funnel", funnelRes, 200, (d) => typeof d.funnel?.delivered === "number");

  // ── 16. Dashboard Context Performance ────────────────────────────────────────
  console.log("\n16. Dashboard context performance");
  const ctxRes = await req("GET", `/v1/merchant/dashboard/context-performance?merchant_id=${actualMerchantId || "m_e2e_01"}`, null, merchantToken);
  check("Dashboard context performance", ctxRes, 200, (d) => Array.isArray(d.context_performance));

  printSummary();
}

function printSummary() {
  const total = passed + failed;
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed}/${total} passed  (${failed} failed)`);
  if (failed === 0) console.log("🎉 All tests passed!");
  else console.log("⚠️  Some tests failed. Check output above.");
  console.log("─".repeat(50));
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("\n💥 Fatal error:", err.message);
  process.exit(1);
});
