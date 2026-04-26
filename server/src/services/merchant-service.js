import { supabase } from "../db/supabase.js";

function nowIso() {
  return new Date().toISOString();
}

/**
 * Resolves a caller-supplied merchant_id (which may be an external id like "m_1021"
 * or an actual UUID) to the Supabase row UUID.
 */
async function resolveMerchantUuid(merchantId) {
  // First try exact UUID match
  const { data: byUuid } = await supabase
    .from("merchants")
    .select("id")
    .eq("id", merchantId)
    .maybeSingle();
  if (byUuid) return byUuid.id;

  // Fall back to external_merchant_id stored in the business_hours JSONB
  const { data: byExtId } = await supabase
    .from("merchants")
    .select("id")
    .eq("business_hours->>external_merchant_id", merchantId)
    .maybeSingle();
  if (byExtId) return byExtId.id;

  return null;
}

export async function createRules(payload) {
  const uuid = await resolveMerchantUuid(payload.merchant_id);
  if (!uuid) throw new Error(`Merchant not found: ${payload.merchant_id}. Seed it first via POST /internal/merchants.`);

  const { error } = await supabase.from("merchant_rules").upsert({
    merchant_id: uuid,
    campaign_goal: payload.campaign_goal || "fill_quiet_hours",
    max_discount_pct: payload.constraints?.max_discount_pct ?? 20,
    max_validity_minutes: payload.constraints?.max_offer_validity_minutes ?? 15,
    excluded_skus: payload.constraints?.excluded_skus ?? [],
    updated_at: nowIso(),
  });

  if (error) throw new Error(`Supabase Error: ${error.message}`);

  return {
    merchant_rule_id: `mr_${Date.now()}`,
    merchant_id: payload.merchant_id,
    status: "active",
    created_at_utc: nowIso(),
  };
}

export async function patchRules(merchantId, patch) {
  const uuid = await resolveMerchantUuid(merchantId);
  if (!uuid) throw new Error(`Merchant not found: ${merchantId}`);

  const { data: current, error: fetchErr } = await supabase
    .from("merchant_rules")
    .select("*")
    .eq("merchant_id", uuid)
    .maybeSingle();

  if (fetchErr) throw new Error(`Supabase Error: ${fetchErr.message}`);

  const merged = {
    merchant_id: uuid,
    campaign_goal: patch.campaign_goal || current?.campaign_goal || "fill_quiet_hours",
    max_discount_pct: patch.constraints?.max_discount_pct ?? current?.max_discount_pct ?? 20,
    max_validity_minutes: patch.constraints?.max_offer_validity_minutes ?? current?.max_validity_minutes ?? 15,
    excluded_skus: patch.constraints?.excluded_skus ?? current?.excluded_skus ?? [],
    updated_at: nowIso(),
  };

  const { error: upsertErr } = await supabase.from("merchant_rules").upsert(merged);
  if (upsertErr) throw new Error(`Supabase Error: ${upsertErr.message}`);

  return {
    merchant_rule_id: patch.merchant_rule_id || `mr_${Date.now()}`,
    merchant_id: merchantId,
    status: "updated",
    updated_at_utc: nowIso(),
  };
}

export async function dashboardOverview(merchantId) {
  const uuid = await resolveMerchantUuid(merchantId);
  if (!uuid) {
    return { merchant_id: merchantId, kpis: { offers_generated: 0, acceptance_rate: 0, redemption_rate: 0, estimated_net_uplift_eur: 0 }, as_of_utc: nowIso() };
  }

  const { data: offers } = await supabase
    .from("offers")
    .select("status, discount_value")
    .eq("merchant_id", uuid);

  const offersCount = offers ? offers.length : 0;
  const accepted = offers ? offers.filter((o) => o.status === "accepted" || o.status === "redeemed").length : 0;
  const redeemed = offers ? offers.filter((o) => o.status === "redeemed").length : 0;

  return {
    merchant_id: merchantId,
    kpis: {
      offers_generated: offersCount,
      acceptance_rate: offersCount ? accepted / offersCount : 0,
      redemption_rate: offersCount ? redeemed / offersCount : 0,
      estimated_net_uplift_eur: Number((redeemed * 6.5).toFixed(2)),
    },
    as_of_utc: nowIso(),
  };
}

export async function dashboardFunnel(merchantId) {
  const uuid = await resolveMerchantUuid(merchantId);
  if (!uuid) {
    return { merchant_id: merchantId, funnel: { delivered: 0, viewed: 0, accepted: 0, redeemed: 0 }, as_of_utc: nowIso() };
  }

  const { data: offers } = await supabase
    .from("offers")
    .select("id, status")
    .eq("merchant_id", uuid);

  const delivered = offers ? offers.length : 0;
  const accepted = offers ? offers.filter((o) => o.status === "accepted" || o.status === "redeemed").length : 0;
  const redeemed = offers ? offers.filter((o) => o.status === "redeemed").length : 0;

  return {
    merchant_id: merchantId,
    funnel: { delivered, viewed: delivered, accepted, redeemed },
    as_of_utc: nowIso(),
  };
}

export async function dashboardContextPerformance(merchantId) {
  const uuid = await resolveMerchantUuid(merchantId);

  const { data: offers } = uuid
    ? await supabase.from("offers").select("status").eq("merchant_id", uuid)
    : { data: [] };

  const offersCount = offers ? offers.length : 0;
  const accepted = offers ? offers.filter((o) => o.status === "accepted" || o.status === "redeemed").length : 0;
  const redeemed = offers ? offers.filter((o) => o.status === "redeemed").length : 0;

  return {
    merchant_id: merchantId,
    context_performance: [
      {
        daypart: "lunch",
        weather_bucket: "unknown",
        accept_rate: offersCount ? accepted / offersCount : 0,
        redemption_rate: offersCount ? redeemed / offersCount : 0,
      },
    ],
    as_of_utc: nowIso(),
  };
}
