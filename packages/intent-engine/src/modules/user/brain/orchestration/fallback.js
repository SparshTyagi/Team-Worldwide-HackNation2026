"use strict";

function fallbackOfferFromIntent(intentPacket) {
  const map = {
    warm_break_seek: {
      headline: "Need a warm break nearby?",
      body_line: "Claim 15% off for the next 15 minutes.",
    },
    quick_lunch_now: {
      headline: "Quick lunch deal close to you",
      body_line: "Save 20% if you redeem in the next 20 minutes.",
    },
    low_receptivity_do_not_push: {
      headline: "Nearby deals in your feed",
      body_line: "Check in-app offers whenever you are ready.",
    },
  };

  const entry = map[intentPacket.intent_label] || {
    headline: "Nearby local offer available",
    body_line: "Open the app to see your best offer right now.",
  };

  return {
    offer_idempotency_key: `fallback_${Date.now()}`,
    headline: entry.headline,
    body_line: entry.body_line,
    cta_text: "Claim now",
    discount_type: "percent",
    discount_value: 15,
    valid_for_minutes: 15,
    tone_style: "friendly",
    model_version: "fallback-template-v1",
    prompt_version: "fallback-template-v1",
  };
}

module.exports = { fallbackOfferFromIntent };
