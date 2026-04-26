"use strict";

const CONFIDENCE_SCORES = {
  default: 0.55,
  quickLunch: 0.78,
  warmBreak: 0.74,
  eveningUnwind: 0.7,
  errandMode: 0.68,
};

function parseClockMinutes(clock) {
  if (typeof clock !== "string" || !/^\d{2}:\d{2}$/.test(clock)) return null;
  const [hh, mm] = clock.split(":").map(Number);
  if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return null;
  }
  return hh * 60 + mm;
}

function isNearPreferredTime(localHour, preferredClock, toleranceMinutes = 90) {
  const preferred = parseClockMinutes(preferredClock);
  if (preferred === null || !Number.isFinite(localHour)) return false;
  const current = localHour * 60;
  return Math.abs(current - preferred) <= toleranceMinutes;
}

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
  let confidence = CONFIDENCE_SCORES.default;
  const weatherSummary = String(context?.weather_summary || "").toLowerCase();
  const food = profile.food_preferences || {};
  const mealTimes = profile.usual_meal_times || {};
  const coffeeMode = Boolean(food.coffee || food.bakery);
  const lunchMode = Boolean(food.ramen || food.salads);
  const eveningMode = Boolean(food.wine_bars || food.gelato);

  if (context.time_bucket === "lunch" && context.movement_state !== "transit") {
    intent = "quick_lunch_now";
    confidence = CONFIDENCE_SCORES.quickLunch;
  } else if (
    context.time_bucket === "morning" &&
    (coffeeMode || isNearPreferredTime(context.local_hour, mealTimes.coffee))
  ) {
    intent = "warm_break_seek";
    confidence = CONFIDENCE_SCORES.warmBreak;
  } else if (weatherSummary.includes("cold")) {
    intent = "warm_break_seek";
    confidence = CONFIDENCE_SCORES.warmBreak;
  } else if (
    context.time_bucket === "evening" &&
    (eveningMode || isNearPreferredTime(context.local_hour, mealTimes.dinner))
  ) {
    intent = "after_work_unwind";
    confidence = CONFIDENCE_SCORES.eveningUnwind;
  } else if (food.salads && context.time_bucket === "afternoon") {
    intent = "errand_mode_daily_needs";
    confidence = CONFIDENCE_SCORES.errandMode;
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
