import { supabase } from "../db/supabase.js";

function nowIso() {
  return new Date().toISOString();
}

export async function createRules(payload) {
  const { error } = await supabase.from("merchant_rules").upsert({
    merchant_id: payload.merchant_id,
    campaign_goal: payload.campaign_goal,
    max_discount_pct: payload.constraints?.max_discount_pct || 20,
    max_validity_minutes: payload.constraints?.max_offer_validity_minutes || 15,
    excluded_skus: payload.constraints?.excluded_skus || [],
    created_at: nowIso(),
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
  const { data: current, error: fetchErr } = await supabase
    .from("merchant_rules")
    .select("*")
    .eq("merchant_id", merchantId)
    .single();

  if (fetchErr && fetchErr.code !== 'PGRST116') throw new Error(`Supabase Error: ${fetchErr.message}`);

  const merged = {
    merchant_id: merchantId,
    campaign_goal: patch.campaign_goal || current?.campaign_goal || "fill_quiet_hours",
    max_discount_pct: patch.constraints?.max_discount_pct ?? current?.max_discount_pct ?? 20,
    max_validity_minutes: patch.constraints?.max_offer_validity_minutes ?? current?.max_validity_minutes ?? 15,
    excluded_skus: patch.constraints?.excluded_skus || current?.excluded_skus || [],
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
  const { data: offers, error } = await supabase
    .from("offers")
    .select("status, discount_value")
    .eq("merchant_id", merchantId);

  if (error) throw new Error(`Supabase Error: ${error.message}`);

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
  // To get the true funnel, we'd query offer_events, but for simplicity we can use offers and their statuses
  const { data: offers, error } = await supabase
    .from("offers")
    .select("id, status")
    .eq("merchant_id", merchantId);

  if (error) throw new Error(`Supabase Error: ${error.message}`);

  const delivered = offers ? offers.length : 0;
  const viewed = delivered;
  const accepted = offers ? offers.filter((o) => o.status === "accepted" || o.status === "redeemed").length : 0;
  const redeemed = offers ? offers.filter((o) => o.status === "redeemed").length : 0;

  return {
    merchant_id: merchantId,
    funnel: { delivered, viewed, accepted, redeemed },
    as_of_utc: nowIso(),
  };
}

export async function dashboardContextPerformance(merchantId) {
  const { data: offers, error } = await supabase
    .from("offers")
    .select("status, generation_meta")
    .eq("merchant_id", merchantId);

  if (error) throw new Error(`Supabase Error: ${error.message}`);

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
