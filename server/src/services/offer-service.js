import { db } from "../data.js";
import { config } from "../config.js";
import { filterMerchantsByLocality } from "../utils/geo.js";
import { generateOffer } from "../llm/client.js";

function nowIso() {
  return new Date().toISOString();
}

export async function ingestIntent(payload) {
  const intentId = payload.intent_id || `intent_${Date.now()}`;
  db.intents.set(intentId, { ...payload, intent_id: intentId, created_at_utc: nowIso() });
  return {
    status: "accepted",
    intent_id: intentId,
    processed_at_utc: nowIso(),
    next_poll_after_seconds: 30,
  };
}

export async function listActiveOffers(query) {
  const user = query.user_pseudonym || "unknown_user";
  const intents = Array.from(db.intents.values()).filter((i) => i.user_pseudonym === user);
  const latestIntent = intents[intents.length - 1];
  const generated = await generateOfferForIntent({
    intentPacket: latestIntent,
    channel: query.channel || "in_app",
    locality: query.locality || latestIntent?.locality,
  });
  const offerRecord = persistGeneratedOffer({
    user,
    merchantId: generated.merchant_id,
    generated: generated.generated,
  });

  return {
    offers: [
      {
        offer_id: offerRecord.offer_id,
        headline: offerRecord.headline,
        body_line: offerRecord.body_line,
        cta_text: offerRecord.cta_text,
        discount_type: offerRecord.discount_type,
        discount_value: offerRecord.discount_value,
        valid_for_minutes: offerRecord.valid_for_minutes,
        tone_style: offerRecord.tone_style,
        ui_layout_variant: offerRecord.ui_layout_variant,
        expires_at_utc: offerRecord.expires_at_utc,
      },
    ],
    generated_at_utc: nowIso(),
  };
}

function buildGenerationInput({ selectedMerchant, merchantRule, intentPacket, channel }) {
  return {
    request_id: `req_${Date.now()}`,
    generation_mode: "offer_card_v1",
    merchant_profile: {
      merchant_id: selectedMerchant.merchant_id,
      category: selectedMerchant.category,
      is_open_now: selectedMerchant.is_open_now,
      price_band: selectedMerchant.price_band,
    },
    constraints: {
      max_discount_pct: merchantRule.constraints?.max_discount_pct || 20,
      campaign_goal: merchantRule.campaign_goal,
      excluded_skus: merchantRule.constraints?.excluded_skus || [],
      max_validity_minutes: merchantRule.constraints?.max_offer_validity_minutes || config.defaults.offerTtlMinutes,
    },
    intent_packet: {
      intent_label: intentPacket?.intent_label || "browse_local_shops",
      intent_confidence: intentPacket?.intent_confidence || 0.55,
      receptivity_level: intentPacket?.receptivity_level || "medium",
      time_budget_minutes: intentPacket?.time_budget_minutes || 15,
      tone_preference: intentPacket?.tone_preference || "neutral",
      hard_constraints: intentPacket?.hard_constraints || [],
    },
    context_snapshot: {
      weather_summary: db.context.weather.at(-1)?.weather_summary || "unknown",
      demand_gap_pct: db.context.payone.at(-1)?.quiet_hour_gap_pct || 0,
      event_intensity: db.context.events.at(-1)?.event_intensity || "low",
      local_time_bucket: "lunch",
    },
    channel_context: {
      channel,
      headline_char_limit: 64,
      body_char_limit: 90,
    },
  };
}

function persistGeneratedOffer({ user, merchantId, generated }) {
  const offerId = generated.output.offer_idempotency_key;
  const expiresAt = new Date(Date.now() + generated.output.valid_for_minutes * 60000).toISOString();
  const offerRecord = {
    offer_id: offerId,
    merchant_id: merchantId,
    user_pseudonym: user,
    status: "shown",
    created_at_utc: nowIso(),
    expires_at_utc: expiresAt,
    generation_meta: generated.meta,
    ...generated.output,
  };
  db.offers.set(offerId, offerRecord);
  db.offerEvents.push({ offer_id: offerId, user_pseudonym: user, event: "shown", at_utc: nowIso() });
  return offerRecord;
}

export async function generateOfferForIntent({ intentPacket, channel = "in_app", locality }) {
  const candidates = filterMerchantsByLocality(
    db.merchants,
    locality || intentPacket?.locality,
    config.defaults.radiusKm
  );
  const selectedMerchant = candidates[0] || db.merchants[0];
  const merchantRule = db.merchantRules.get(selectedMerchant.merchant_id) || {
    campaign_goal: "fill_quiet_hours",
    constraints: { max_discount_pct: 20, max_validity_minutes: config.defaults.offerTtlMinutes },
  };
  const generationInput = buildGenerationInput({
    selectedMerchant,
    merchantRule,
    intentPacket,
    channel,
  });
  const generated = await generateOffer(generationInput);
  return {
    merchant_id: selectedMerchant.merchant_id,
    model_version: generated.meta?.model || config.llmModel,
    prompt_version: "offer_prompt_v1",
    offer: generated.output,
    used_fallback: Boolean(generated.meta?.used_fallback),
    generated,
  };
}

export function recordDecision(payload) {
  const offer = db.offers.get(payload.offer_id);
  if (!offer) {
    return { error: "offer_not_found" };
  }

  offer.status = payload.decision === "accept" ? "accepted" : "dismissed";
  db.offerEvents.push({
    offer_id: payload.offer_id,
    user_pseudonym: payload.user_pseudonym,
    event: payload.decision,
    at_utc: payload.decision_timestamp_utc || nowIso(),
  });

  return {
    offer_id: payload.offer_id,
    status: "recorded",
    decision: payload.decision,
    recorded_at_utc: nowIso(),
  };
}

export function createRedemptionToken(payload) {
  const token = `tok_${Math.random().toString(36).slice(2, 10)}`;
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

  db.redemptions.set(token, {
    token,
    offer_id: payload.offer_id,
    merchant_id: payload.merchant_id,
    user_pseudonym: payload.user_pseudonym,
    status: "issued",
    expires_at_utc: expiresAt,
  });

  return {
    offer_id: payload.offer_id,
    token,
    qr_payload: token,
    expires_at_utc: expiresAt,
    ttl_seconds: 180,
  };
}

export function validateRedemption(payload) {
  const row = db.redemptions.get(payload.token);
  if (!row) return { error: "token_not_found" };

  if (new Date(row.expires_at_utc).getTime() < Date.now()) {
    row.status = "expired";
    return { token: payload.token, is_valid: false, reason: "expired" };
  }

  row.status = "redeemed";
  const cashback = 0.75;
  const current = db.cashbackByUser.get(row.user_pseudonym) || 0;
  db.cashbackByUser.set(row.user_pseudonym, Number((current + cashback).toFixed(2)));

  const offer = db.offers.get(row.offer_id);
  if (offer) offer.status = "redeemed";

  return {
    token: payload.token,
    is_valid: true,
    redemption_id: `rdm_${Date.now()}`,
    cashback_credited_eur: cashback,
    validated_at_utc: nowIso(),
  };
}

export function getCashback(userPseudonym) {
  return {
    user_pseudonym: userPseudonym,
    cashback_balance_eur: db.cashbackByUser.get(userPseudonym) || 0,
    updated_at_utc: nowIso(),
  };
}
