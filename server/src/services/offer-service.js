import { supabase } from "../db/supabase.js";
import { config } from "../config.js";
import { filterMerchantsByLocality } from "../utils/geo.js";
import { generateOffer } from "../llm/client.js";
import QRCode from "qrcode";

function nowIso() {
  return new Date().toISOString();
}

export async function ingestIntent(payload) {
  const intentId = payload.intent_id || `intent_${Date.now()}`;
  const { error } = await supabase.from("intents").insert({
    id: intentId, // Note: intentId should be UUID or use default
    user_id: payload.user_id, // assuming payload has user_id
    intent_label: payload.intent_label,
    intent_confidence: payload.intent_confidence,
    receptivity_level: payload.receptivity_level,
    time_budget_minutes: payload.time_budget_minutes,
    tone_preference: payload.tone_preference,
    hard_constraints: payload.hard_constraints || [],
    locality: payload.locality || {},
    created_at: nowIso(),
  });

  if (error) throw new Error(`Supabase Error: ${error.message}`);

  return {
    status: "accepted",
    intent_id: intentId,
    processed_at_utc: nowIso(),
    next_poll_after_seconds: 30,
  };
}

export async function listActiveOffers(query) {
  const user = query.user_pseudonym || "unknown_user";
  
  // Try to find the user id from pseudonym (mocking if not exists, but we should rely on proper user_ids)
  // For simplicity, we just use user_id if passed, or fetch it
  const { data: userData } = await supabase.from("users").select("id").eq("pseudonym", user).single();
  const userId = userData?.id;

  if (!userId) {
    throw new Error("User not found in DB");
  }

  const { data: intents } = await supabase.from("intents").select("*").eq("user_id", userId).order('created_at', { ascending: false }).limit(1);
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
    offers: [
      {
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
      },
    ],
    generated_at_utc: nowIso(),
  };
}

async function buildGenerationInput({ selectedMerchant, merchantRule, intentPacket, channel }) {
  const { data: weather } = await supabase.from("context_snapshots").select("*").eq("snapshot_type", "weather").order('created_at', { ascending: false }).limit(1);
  const { data: payone } = await supabase.from("context_snapshots").select("*").eq("snapshot_type", "payone").order('created_at', { ascending: false }).limit(1);
  const { data: events } = await supabase.from("context_snapshots").select("*").eq("snapshot_type", "events").order('created_at', { ascending: false }).limit(1);

  return {
    request_id: `req_${Date.now()}`,
    generation_mode: "offer_card_v1",
    merchant_profile: {
      merchant_id: selectedMerchant.id,
      category: selectedMerchant.category,
      is_open_now: true,
      price_band: "mid",
    },
    constraints: {
      max_discount_pct: merchantRule?.max_discount_pct || 20,
      campaign_goal: merchantRule?.campaign_goal || "fill_quiet_hours",
      excluded_skus: merchantRule?.excluded_skus || [],
      max_validity_minutes: merchantRule?.max_validity_minutes || config.defaults.offerTtlMinutes,
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
      weather_summary: weather?.[0]?.payload?.weather_summary || "unknown",
      demand_gap_pct: payone?.[0]?.payload?.quiet_hour_gap_pct || 0,
      event_intensity: events?.[0]?.payload?.event_intensity || "low",
      local_time_bucket: "lunch",
    },
    channel_context: {
      channel,
      headline_char_limit: 64,
      body_char_limit: 90,
    },
  };
}

async function persistGeneratedOffer({ userId, merchantId, generated }) {
  const expiresAt = new Date(Date.now() + generated.output.valid_for_minutes * 60000).toISOString();
  
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

  const { data: offerData, error } = await supabase.from("offers").insert(offerRow).select().single();
  if (error) throw new Error(`Supabase Error: ${error.message}`);

  await supabase.from("offer_events").insert({
    offer_id: offerData.id,
    user_id: userId,
    event_type: "shown"
  });

  return offerData;
}

export async function generateOfferForIntent({ intentPacket, channel = "in_app", locality }) {
  const { data: allMerchants } = await supabase.from("merchants").select("*");
  const candidates = filterMerchantsByLocality(
    allMerchants || [],
    locality || intentPacket?.locality,
    config.defaults.radiusKm
  );
  
  const selectedMerchant = candidates[0] || allMerchants?.[0];
  if (!selectedMerchant) throw new Error("No merchants found in database");

  const { data: merchantRule } = await supabase.from("merchant_rules").select("*").eq("merchant_id", selectedMerchant.id).single();

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
  const { data: offer, error: fetchErr } = await supabase.from("offers").select("*").eq("id", payload.offer_id).single();
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
  const token = `tok_${Math.random().toString(36).slice(2, 10)}`;
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

  // Find offer to get user_id and merchant_id
  const { data: offer } = await supabase.from("offers").select("*").eq("id", payload.offer_id).single();
  if (!offer) throw new Error("Offer not found");

  // Insert token atomically
  const { error } = await supabase.from("redemptions").insert({
    offer_id: payload.offer_id,
    merchant_id: offer.merchant_id,
    user_id: offer.user_id,
    status: "pending",
    expires_at_utc: expiresAt, 
  });
  // Note: Schema says `token` defaults to uuid_generate_v4().
  // Let's rely on DB generated token instead.
  
  const { data: redemption, error: rErr } = await supabase.from("redemptions").insert({
    offer_id: payload.offer_id,
    merchant_id: offer.merchant_id,
    user_id: offer.user_id,
    status: "pending"
  }).select().single();
  
  if (rErr) throw new Error(`Supabase Error: ${rErr.message}`);

  // Generate QR code data URI
  const qrDataUrl = await QRCode.toDataURL(redemption.token, { width: 300 });

  return {
    offer_id: payload.offer_id,
    token: redemption.token,
    qr_payload: qrDataUrl,
    expires_at_utc: redemption.created_at, // + 3 mins in UI
    ttl_seconds: 180,
  };
}

export async function validateRedemption(payload) {
  // Find token
  const { data: row, error: fetchErr } = await supabase.from("redemptions").select("*").eq("token", payload.token).single();
  if (fetchErr || !row) return { error: "token_not_found" };

  if (row.status !== "pending") {
    return { token: payload.token, is_valid: false, reason: "Token already used or expired" };
  }

  // Double-spend lock: update where status = pending
  const { data: updated, error: updateErr } = await supabase.from("redemptions")
    .update({ status: "redeemed", redeemed_at: nowIso(), cashback_eur: 0.75 })
    .eq("token", payload.token)
    .eq("status", "pending")
    .select()
    .single();

  if (updateErr || !updated) {
    return { token: payload.token, is_valid: false, reason: "Failed to redeem, possibly a double spend" };
  }

  // Update offer status
  await supabase.from("offers").update({ status: "redeemed" }).eq("id", row.offer_id);

  return {
    token: payload.token,
    is_valid: true,
    redemption_id: updated.id,
    cashback_credited_eur: 0.75,
    validated_at_utc: nowIso(),
  };
}

export async function getCashback(userPseudonym) {
  const { data: user } = await supabase.from("users").select("id").eq("pseudonym", userPseudonym).single();
  if (!user) return { cashback_balance_eur: 0 };

  const { data: redemptions, error } = await supabase.from("redemptions").select("cashback_eur").eq("user_id", user.id).eq("status", "redeemed");
  
  const total = (redemptions || []).reduce((sum, r) => sum + Number(r.cashback_eur), 0);

  return {
    user_pseudonym: userPseudonym,
    cashback_balance_eur: total,
    updated_at_utc: nowIso(),
  };
}
