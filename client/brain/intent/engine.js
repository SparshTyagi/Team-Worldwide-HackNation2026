"use strict";

const { INTENT_LABELS } = require("../contracts/schemas.js");

function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function pickTonePreference(profile = {}) {
  const preferred = profile.offer_tone || "friendly";
  if (["factual", "emotional", "neutral", "minimal", "friendly", "playful"].includes(preferred)) {
    return preferred;
  }
  return "friendly";
}

function computeFatigueScore(interaction = {}) {
  const dismisses = interaction.dismiss_count_7d || 0;
  const accepts = interaction.accept_count_7d || 0;
  const delivered = Math.max(1, interaction.delivered_count_7d || dismisses + accepts);
  const dismissRate = dismisses / delivered;
  return clamp01(dismissRate);
}

function classifyIntent({ context, profile = {}, interaction = {} }) {
  let intent = "browse_local_shops";
  let confidence = 0.55;

  if (context.time_bucket === "lunch" && context.movement_state !== "transit") {
    intent = "quick_lunch_now";
    confidence = 0.78;
  } else if (context.weather_summary.toLowerCase().includes("cold")) {
    intent = "warm_break_seek";
    confidence = 0.74;
  } else if (context.time_bucket === "evening") {
    intent = "after_work_unwind";
    confidence = 0.7;
  } else if (Array.isArray(profile.interests) && profile.interests.includes("groceries")) {
    intent = "errand_mode_daily_needs";
    confidence = 0.68;
  }

  if (!INTENT_LABELS.includes(intent)) {
    intent = "browse_local_shops";
    confidence = 0.55;
  }

  const fatigue = computeFatigueScore(interaction);
  const lowConfidenceThreshold = 0.55;
  if (confidence < lowConfidenceThreshold || fatigue > 0.75) {
    intent = "low_receptivity_do_not_push";
    confidence = Math.min(confidence, 0.5);
  }

  let receptivity = "medium";
  if (confidence >= 0.75 && fatigue < 0.5) receptivity = "high";
  if (confidence < 0.6 || fatigue > 0.65) receptivity = "low";

  return {
    intent_label: intent,
    intent_confidence: Number(confidence.toFixed(2)),
    receptivity_level: receptivity,
    fatigue_score: Number(fatigue.toFixed(2)),
    channel_hint: fatigue > 0.75 ? "in_app_only" : "push",
    tone_preference: pickTonePreference(profile),
  };
}

module.exports = {
  classifyIntent,
  computeFatigueScore,
};
