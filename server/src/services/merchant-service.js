import { db } from "../data.js";

function nowIso() {
  return new Date().toISOString();
}

export function createRules(payload) {
  db.merchantRules.set(payload.merchant_id, payload);
  return {
    merchant_rule_id: `mr_${Date.now()}`,
    merchant_id: payload.merchant_id,
    status: "active",
    created_at_utc: nowIso(),
  };
}

export function patchRules(merchantId, patch) {
  const current = db.merchantRules.get(merchantId) || { merchant_id: merchantId, constraints: {} };
  const merged = {
    ...current,
    ...patch,
    constraints: {
      ...(current.constraints || {}),
      ...(patch.constraints || {}),
    },
  };

  db.merchantRules.set(merchantId, merged);
  return {
    merchant_rule_id: patch.merchant_rule_id || `mr_${Date.now()}`,
    merchant_id: merchantId,
    status: "updated",
    updated_at_utc: nowIso(),
  };
}

export function dashboardOverview(merchantId) {
  const offers = Array.from(db.offers.values()).filter((o) => o.merchant_id === merchantId);
  const accepted = offers.filter((o) => o.status === "accepted" || o.status === "redeemed").length;
  const redeemed = offers.filter((o) => o.status === "redeemed").length;

  return {
    merchant_id: merchantId,
    kpis: {
      offers_generated: offers.length,
      acceptance_rate: offers.length ? accepted / offers.length : 0,
      redemption_rate: offers.length ? redeemed / offers.length : 0,
      estimated_net_uplift_eur: Number((redeemed * 6.5).toFixed(2)),
    },
    as_of_utc: nowIso(),
  };
}

export function dashboardFunnel(merchantId) {
  const events = db.offerEvents.filter((e) => {
    const offer = db.offers.get(e.offer_id);
    return offer?.merchant_id === merchantId;
  });

  const delivered = events.filter((e) => e.event === "shown").length;
  const viewed = delivered;
  const accepted = events.filter((e) => e.event === "accept").length;
  const redeemed = Array.from(db.offers.values()).filter((o) => o.merchant_id === merchantId && o.status === "redeemed").length;

  return {
    merchant_id: merchantId,
    funnel: { delivered, viewed, accepted, redeemed },
    as_of_utc: nowIso(),
  };
}

export function dashboardContextPerformance(merchantId) {
  const offers = Array.from(db.offers.values()).filter((o) => o.merchant_id === merchantId);
  const accepted = offers.filter((o) => o.status === "accepted" || o.status === "redeemed").length;
  const redeemed = offers.filter((o) => o.status === "redeemed").length;

  return {
    merchant_id: merchantId,
    context_performance: [
      {
        daypart: "lunch",
        weather_bucket: db.context.weather.at(-1)?.condition || "unknown",
        accept_rate: offers.length ? accepted / offers.length : 0,
        redemption_rate: offers.length ? redeemed / offers.length : 0,
      },
    ],
    as_of_utc: nowIso(),
  };
}
