import { supabase } from "../../db/supabase.js";
import { config } from "../../config.js";
import { filterMerchantsByLocality } from "../../utils/geo.js";
import { generateOffer } from "../shared/ai/client.js";
import QRCode from "qrcode";

function nowIso() {
  return new Date().toISOString();
}

const DIETARY_FLAGS = [
  "vegan",
  "vegetarian",
  "gluten_free",
  "halal",
  "kosher",
  "nut_free",
  "dairy_free",
  "low_sugar",
];

function normalizeDietaryFromHardConstraints(hardConstraints = []) {
  if (!Array.isArray(hardConstraints)) return [];
  const values = hardConstraints
    .filter((item) => typeof item === "string" && item.startsWith("dietary_"))
    .map((item) => item.slice("dietary_".length))
    .filter((item) => DIETARY_FLAGS.includes(item));
  return [...new Set(values)];
}

function normalizeStringList(input = []) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((x) => typeof x === "string" && x.trim().length).map((x) => x.trim()))];
}

function scoreMerchantForIntent(merchant, intentPacket) {
  const meta = merchant.business_hours || {};
  const intentProfile =
    intentPacket?.client_profile_signals ||
    intentPacket?.locality?.client_profile_signals ||
    {};
  const preferredCuisines = normalizeStringList(intentProfile.preferred_cuisines);
  const preferredDietary = normalizeStringList(intentProfile.dietary_restrictions);
  const hardConstraintDietary = normalizeDietaryFromHardConstraints(intentPacket?.hard_constraints);
  const requiredDietary = [...new Set([...preferredDietary, ...hardConstraintDietary])];

  let score = 0;

  if (meta.is_open_now === true) score += 2;
  if ((meta.budget ?? 0) > 0) score += 1.5;

  const merchantCuisine = String(meta.cuisine || merchant.category || "").toLowerCase();
  if (preferredCuisines.length && preferredCuisines.includes(merchantCuisine)) score += 3;

  const merchantDietary = normalizeStringList(meta.dietary_restrictions).map((x) => x.toLowerCase());
  if (requiredDietary.length) {
    const coverage = requiredDietary.filter((req) => merchantDietary.includes(req.toLowerCase())).length;
    score += coverage * 1.5;
  }

  return score;
}

function computeBudgetDeduction({ offer, merchantMeta }) {
  const discountType = offer?.discount_type;
  const discountValue = Number(offer?.discount_value || 0);
  if (!Number.isFinite(discountValue) || discountValue <= 0) return 0;

  if (discountType === "fixed") {
    return Number(discountValue.toFixed(2));
  }

  const avgTicket = Number(merchantMeta?.avg_ticket_size_eur || 0);
  const pctDeduction = (avgTicket * discountValue) / 100;
  return Number(Math.max(0, pctDeduction).toFixed(2));
}

/**
 * Resolves a user pseudonym to a DB UUID, creating the user row if it doesn't exist.
 */
async function resolveUserId(pseudonym) {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("pseudonym", pseudonym)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("users")
    .insert({ pseudonym })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return created.id;
}

export async function ingestIntent(payload) {
  const userId = await resolveUserId(payload.user_pseudonym);
  const localityWithSignals = {
    ...(payload.locality || {}),
    context_snapshot: payload.context_snapshot || null,
    client_profile_signals: payload.client_profile_signals || null,
  };

  const { error } = await supabase.from("intents").insert({
    user_id: userId,
    intent_label: payload.intent_label,
    intent_confidence: payload.intent_confidence ?? null,
    receptivity_level: payload.receptivity_level ?? null,
    time_budget_minutes: payload.time_budget_minutes ?? null,
    tone_preference: payload.tone_preference ?? null,
    hard_constraints: payload.hard_constraints ?? [],
    locality: localityWithSignals,
  });

  if (error) throw new Error(`Supabase Error: ${error.message}`);

  return {
    status: "accepted",
    intent_id: `intent_${Date.now()}`,
    processed_at_utc: nowIso(),
    next_poll_after_seconds: 30,
  };
}

export async function listActiveOffers(query) {
  const user = query.user_pseudonym || "unknown_user";
  const userId = await resolveUserId(user);

  const nowMs = Date.now();
  const { data: existingOffers } = await supabase
    .from("offers")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["shown", "accepted"])
    .gt("expires_at", new Date(nowMs).toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  if (existingOffers && existingOffers.length > 0) {
    return {
      offers: existingOffers.map(toActiveOfferCard),
      generated_at_utc: nowIso(),
    };
  }

  const { data: intents } = await supabase
    .from("intents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestIntent = intents?.[0];

  const generated = await generateOfferForIntent({
    intentPacket: latestIntent,
    channel: query.channel || "in_app",
    locality: query.locality || latestIntent?.locality,
  });

  const offerRecord = await persistGeneratedOffer({
    userId,
    merchantId: generated.merchant_id,
    generated: generated.generated,
  });

  return {
    offers: [toActiveOfferCard(offerRecord)],
    generated_at_utc: nowIso(),
  };
}

function toActiveOfferCard(offerRecord) {
  return {
    offer_id: offerRecord.id,
    headline: offerRecord.headline,
    body_line: offerRecord.body_line,
    cta_text: offerRecord.cta_text,
    discount_type: offerRecord.discount_type,
    discount_value: offerRecord.discount_value,
    valid_for_minutes: offerRecord.valid_for_minutes,
    tone_style: offerRecord.tone_style,
    ui_layout_variant: offerRecord.ui_layout_variant,
    expires_at_utc: offerRecord.expires_at,
  };
}

async function buildGenerationInput({ selectedMerchant, merchantRule, intentPacket, channel }) {
  const merchantMeta = selectedMerchant.business_hours || {};
  const intentProfile =
    intentPacket?.client_profile_signals ||
    intentPacket?.locality?.client_profile_signals ||
    {};
  const intentContext =
    intentPacket?.context_snapshot ||
    intentPacket?.locality?.context_snapshot ||
    {};
  const intentDietary = normalizeStringList(intentProfile.dietary_restrictions);
  const hardConstraintDietary = normalizeDietaryFromHardConstraints(intentPacket?.hard_constraints);
  const normalizedDietary = [...new Set([...intentDietary, ...hardConstraintDietary])];
  const preferredCuisines = normalizeStringList(intentProfile.preferred_cuisines);
  const { data: weather } = await supabase
    .from("context_snapshots")
    .select("payload")
    .eq("snapshot_type", "weather")
    .order("created_at", { ascending: false })
    .limit(1);

  const { data: payone } = await supabase
    .from("context_snapshots")
    .select("payload")
    .eq("snapshot_type", "payone")
    .order("created_at", { ascending: false })
    .limit(1);

  const { data: events } = await supabase
    .from("context_snapshots")
    .select("payload")
    .eq("snapshot_type", "events")
    .order("created_at", { ascending: false })
    .limit(1);

  return {
    request_id: `req_${Date.now()}`,
    generation_mode: "offer_card_v1",
    merchant_profile: {
      merchant_id: selectedMerchant.id,
      category: selectedMerchant.category,
      cuisine: merchantMeta.cuisine ?? selectedMerchant.category ?? "unknown",
      discount_events: Array.isArray(merchantMeta.discount_events)
        ? merchantMeta.discount_events
        : [],
      dietary_restrictions: Array.isArray(merchantMeta.dietary_restrictions)
        ? merchantMeta.dietary_restrictions
        : [],
      hours: Array.isArray(merchantMeta.hours) ? merchantMeta.hours : ["Unknown"],
      max_discount_value: merchantMeta.max_discount_value ?? 0,
      budget: merchantMeta.budget ?? 0,
      is_open_now: merchantMeta.is_open_now ?? true,
      price_band: merchantMeta.price_band ?? "mid",
    },
    constraints: {
      max_discount_pct: merchantRule?.max_discount_pct ?? 20,
      max_discount_value: merchantMeta.max_discount_value ?? 0,
      budget: merchantMeta.budget ?? 0,
      campaign_goal: merchantRule?.campaign_goal ?? "fill_quiet_hours",
      excluded_skus: merchantRule?.excluded_skus ?? [],
      max_validity_minutes: merchantRule?.max_validity_minutes ?? config.defaults.offerTtlMinutes,
    },
    intent_packet: {
      intent_label: intentPacket?.intent_label ?? "browse_local_shops",
      intent_confidence: intentPacket?.intent_confidence ?? 0.55,
      receptivity_level: intentPacket?.receptivity_level ?? "medium",
      time_budget_minutes: intentPacket?.time_budget_minutes ?? 15,
      tone_preference: intentPacket?.tone_preference ?? "neutral",
      hard_constraints: intentPacket?.hard_constraints ?? [],
      dietary_restrictions: normalizedDietary,
      preferred_cuisines: preferredCuisines,
    },
    context_snapshot: {
      weather_summary:
        intentContext.weather_summary ??
        weather?.[0]?.payload?.weather_summary ??
        "unknown",
      temperature_c:
        Number.isFinite(Number(intentContext.temperature_c))
          ? Number(intentContext.temperature_c)
          : weather?.[0]?.payload?.temperature_c ?? null,
      demand_gap_pct: payone?.[0]?.payload?.quiet_hour_gap_pct ?? 0,
      event_intensity:
        intentContext.event_intensity ??
        events?.[0]?.payload?.event_intensity ??
        "low",
      local_time_bucket: intentContext.local_time_bucket ?? "lunch",
      now_utc: intentContext.now_utc ?? nowIso(),
      events: Array.isArray(intentContext.events)
        ? intentContext.events
        : Array.isArray(events?.[0]?.payload?.events)
          ? events[0].payload.events.map((ev) => ({
              title: ev.title || "event",
              category: ev.category || "general",
            }))
          : [],
    },
    channel_context: {
      channel,
      headline_char_limit: 64,
      body_char_limit: 90,
    },
  };
}

async function persistGeneratedOffer({ userId, merchantId, generated }) {
  const expiresAt = new Date(
    Date.now() + (generated.output.valid_for_minutes ?? config.defaults.offerTtlMinutes) * 60000,
  ).toISOString();

  const offerRow = {
    merchant_id: merchantId,
    user_id: userId,
    headline: generated.output.headline,
    body_line: generated.output.body_line,
    cta_text: generated.output.cta_text,
    discount_type: generated.output.discount_type,
    discount_value: generated.output.discount_value,
    valid_for_minutes: generated.output.valid_for_minutes,
    tone_style: generated.output.tone_style,
    ui_layout_variant: generated.output.ui_layout_variant,
    status: "shown",
    generation_meta: generated.meta,
    expires_at: expiresAt,
  };

  const { data: offerData, error } = await supabase
    .from("offers")
    .insert(offerRow)
    .select()
    .single();

  if (error) throw new Error(`Supabase Error: ${error.message}`);

  await supabase.from("offer_events").insert({
    offer_id: offerData.id,
    user_id: userId,
    event_type: "shown",
  });

  return offerData;
}

export async function generateOfferForIntent({ intentPacket, channel = "in_app", locality }) {
  const { data: allMerchants } = await supabase.from("merchants").select("*");
  const candidates = filterMerchantsByLocality(
    allMerchants || [],
    locality || intentPacket?.locality,
    config.defaults.radiusKm,
  );

  const pool = candidates.length ? candidates : allMerchants || [];
  const ranked = pool
    .map((merchant) => ({ merchant, score: scoreMerchantForIntent(merchant, intentPacket) }))
    .sort((a, b) => b.score - a.score);
  const selectedMerchant = ranked[0]?.merchant || allMerchants?.[0];
  if (!selectedMerchant) {
    throw new Error("No merchants found in database. Please seed via POST /internal/merchants.");
  }

  const { data: merchantRule } = await supabase
    .from("merchant_rules")
    .select("*")
    .eq("merchant_id", selectedMerchant.id)
    .maybeSingle();

  const generationInput = await buildGenerationInput({
    selectedMerchant,
    merchantRule,
    intentPacket,
    channel,
  });

  const generated = await generateOffer(generationInput);
  return {
    merchant_id: selectedMerchant.id,
    model_version: generated.meta?.model || config.llmModel,
    prompt_version: "offer_prompt_v1",
    offer: generated.output,
    used_fallback: Boolean(generated.meta?.used_fallback),
    generated,
  };
}

export async function recordDecision(payload) {
  const { data: offer, error: fetchErr } = await supabase
    .from("offers")
    .select("*")
    .eq("id", payload.offer_id)
    .maybeSingle();

  if (fetchErr || !offer) return { error: "offer_not_found" };

  const decisionStatus = payload.decision === "accept" ? "accepted" : "dismissed";

  await supabase.from("offers").update({ status: decisionStatus }).eq("id", payload.offer_id);

  await supabase.from("offer_events").insert({
    offer_id: payload.offer_id,
    user_id: offer.user_id,
    event_type: decisionStatus,
    created_at: payload.decision_timestamp_utc || nowIso(),
  });

  return {
    offer_id: payload.offer_id,
    status: "recorded",
    decision: payload.decision,
    recorded_at_utc: nowIso(),
  };
}

export async function createRedemptionToken(payload) {
  const { data: offer, error: offerErr } = await supabase
    .from("offers")
    .select("*")
    .eq("id", payload.offer_id)
    .maybeSingle();

  if (offerErr || !offer) throw new Error("Offer not found");

  const { data: redemption, error } = await supabase
    .from("redemptions")
    .insert({
      offer_id: payload.offer_id,
      merchant_id: offer.merchant_id,
      user_id: offer.user_id,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase Error: ${error.message}`);

  const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
  const qrDataUrl = await QRCode.toDataURL(String(redemption.token), { width: 300 });

  return {
    offer_id: payload.offer_id,
    token: String(redemption.token),
    qr_payload: qrDataUrl,
    expires_at_utc: expiresAt,
    ttl_seconds: 180,
  };
}

export async function validateRedemption(payload) {
  const { data: row, error: fetchErr } = await supabase
    .from("redemptions")
    .select("*")
    .eq("token", payload.token)
    .maybeSingle();

  if (fetchErr || !row) return { error: "token_not_found" };

  if (row.status !== "pending") {
    return { error: `token_not_redeemable: status is ${row.status}` };
  }

  const redeemTime = nowIso();
  const { data: updated, error: updateErr } = await supabase
    .from("redemptions")
    .update({ status: "redeemed", redeemed_at: redeemTime, cashback_eur: 0.75 })
    .eq("token", payload.token)
    .eq("status", "pending")
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "redemption_failed: possible double-spend attempt" };
  }

  await supabase.from("offers").update({ status: "redeemed" }).eq("id", row.offer_id);

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, business_hours")
    .eq("id", row.merchant_id)
    .maybeSingle();

  let merchantBudget = null;
  if (merchant) {
    const meta = merchant.business_hours || {};
    const previousBudget = Number(meta.budget ?? 0);
    const { data: offerRow } = await supabase
      .from("offers")
      .select("discount_type, discount_value")
      .eq("id", row.offer_id)
      .maybeSingle();
    const deductedAmount = computeBudgetDeduction({
      offer: offerRow || {},
      merchantMeta: meta,
    });
    const remainingBudget = Number(Math.max(0, previousBudget - deductedAmount).toFixed(2));

    await supabase
      .from("merchants")
      .update({
        business_hours: {
          ...meta,
          budget: remainingBudget,
        },
      })
      .eq("id", merchant.id);

    merchantBudget = {
      merchant_id: String(merchant.id),
      previous_budget: Number(previousBudget.toFixed(2)),
      deducted_amount: deductedAmount,
      remaining_budget: remainingBudget,
      updated_at_utc: redeemTime,
    };
  }

  return {
    token: String(payload.token),
    is_valid: true,
    redemption_id: String(updated.id),
    cashback_credited_eur: 0.75,
    merchant_budget: merchantBudget || undefined,
    validated_at_utc: redeemTime,
  };
}

export async function getCashback(userPseudonym) {
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("pseudonym", userPseudonym)
    .maybeSingle();

  if (!user) {
    return { user_pseudonym: userPseudonym, cashback_balance_eur: 0, updated_at_utc: nowIso() };
  }

  const { data: redemptions } = await supabase
    .from("redemptions")
    .select("cashback_eur")
    .eq("user_id", user.id)
    .eq("status", "redeemed");

  const total = (redemptions || []).reduce((sum, r) => sum + Number(r.cashback_eur), 0);

  return {
    user_pseudonym: userPseudonym,
    cashback_balance_eur: Number(total.toFixed(2)),
    updated_at_utc: nowIso(),
  };
}
