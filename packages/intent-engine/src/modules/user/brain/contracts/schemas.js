"use strict";

const INTENT_LABELS = [
  "warm_break_seek",
  "quick_lunch_now",
  "browse_local_shops",
  "after_work_unwind",
  "errand_mode_daily_needs",
  "event_adjacent_visit",
  "low_receptivity_do_not_push",
];

const RECEPTIVITY_LEVELS = ["low", "medium", "high"];
const MOBILITY_MODES = ["walking", "stationary", "transit"];
const SENSITIVITY_LEVELS = ["low", "medium", "high"];
const TONE_PREFERENCES = ["factual", "emotional", "neutral", "minimal", "friendly", "playful"];
const DISCOUNT_TYPES = ["percent", "fixed"];
const OFFER_TONE_STYLES = ["factual", "friendly", "minimal", "playful", "emotional", "neutral"];
const DECISION_TYPES = ["accept", "dismiss", "redeem", "expire"];
const CHANNEL_HINTS = ["push", "in_app_only", "in_app", "widget"];
const INTENT_SOURCES = ["embedded_onnx", "local_small_model", "heuristic_fallback"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function assertString(value, fieldName) {
  assert(typeof value === "string" && value.length > 0, `${fieldName} must be a non-empty string`);
}

function assertEnum(value, fieldName, allowed) {
  assert(allowed.includes(value), `${fieldName} must be one of: ${allowed.join(", ")}`);
}

function validateLocalityLimiter(locality) {
  assert(isObject(locality), "locality must be an object");
  const hasRadius = isFiniteNumber(locality.radius_km);
  const hasCells = Array.isArray(locality.area_cell_ids) && locality.area_cell_ids.length > 0;
  const hasNearbyMerchants =
    Array.isArray(locality.nearby_merchant_ids) && locality.nearby_merchant_ids.length > 0;

  assert(
    hasRadius || hasCells || hasNearbyMerchants,
    "locality must include at least one of: radius_km, area_cell_ids, nearby_merchant_ids",
  );

  if (hasRadius) {
    assert(locality.radius_km > 0 && locality.radius_km <= 10, "radius_km must be > 0 and <= 10");
  }

  if (hasCells) {
    locality.area_cell_ids.forEach((cell, index) => assertString(cell, `area_cell_ids[${index}]`));
  }

  if (hasNearbyMerchants) {
    locality.nearby_merchant_ids.forEach((id, index) =>
      assertString(id, `nearby_merchant_ids[${index}]`),
    );
  }

  return locality;
}

function validateConsentMask(mask) {
  assert(isObject(mask), "consent mask must be an object");
  const keys = [
    "precise_location",
    "background_location",
    "learn_from_accepted_offers",
    "learn_from_dismissed_offers",
    "learn_from_redeemed_offers",
    "push_notifications",
    "anonymous_merchant_analytics",
  ];
  keys.forEach((key) => assert(typeof mask[key] === "boolean", `${key} must be boolean`));
  return mask;
}

function validateIntentPacket(packet) {
  assert(isObject(packet), "intent packet must be an object");
  assertString(packet.intent_id, "intent_id");
  assertString(packet.timestamp_utc, "timestamp_utc");
  assertString(packet.user_pseudonym, "user_pseudonym");
  assertString(packet.intent_label, "intent_label");
  assert(isFiniteNumber(packet.intent_confidence), "intent_confidence must be a finite number");
  assert(packet.intent_confidence >= 0 && packet.intent_confidence <= 1, "intent_confidence must be 0..1");
  assertEnum(packet.receptivity_level, "receptivity_level", RECEPTIVITY_LEVELS);
  assert(Number.isInteger(packet.time_budget_minutes), "time_budget_minutes must be integer");
  assert(packet.time_budget_minutes >= 3 && packet.time_budget_minutes <= 120, "time_budget_minutes must be 3..120");
  assertEnum(packet.mobility_mode, "mobility_mode", MOBILITY_MODES);
  assertEnum(packet.sensitivity_level, "sensitivity_level", SENSITIVITY_LEVELS);
  assertEnum(packet.tone_preference, "tone_preference", TONE_PREFERENCES);
  assert(Array.isArray(packet.hard_constraints), "hard_constraints must be an array");
  packet.hard_constraints.forEach((item, index) => assertString(item, `hard_constraints[${index}]`));
  validateLocalityLimiter(packet.locality);

  if (packet.channel_hint !== undefined) {
    assertEnum(packet.channel_hint, "channel_hint", CHANNEL_HINTS);
  }

  if (packet.client_profile_signals !== undefined) {
    assert(isObject(packet.client_profile_signals), "client_profile_signals must be an object");
    const { home_location, work_location, usual_meal_times, food_preferences, location_access } =
      packet.client_profile_signals;

    const validateLocation = (location, fieldName) => {
      if (location === null || location === undefined) return;
      assert(isObject(location), `${fieldName} must be an object or null`);
      assert(isFiniteNumber(location.lat), `${fieldName}.lat must be numeric`);
      assert(isFiniteNumber(location.lon), `${fieldName}.lon must be numeric`);
    };
    validateLocation(home_location, "client_profile_signals.home_location");
    validateLocation(work_location, "client_profile_signals.work_location");

    if (usual_meal_times !== undefined && usual_meal_times !== null) {
      assert(isObject(usual_meal_times), "client_profile_signals.usual_meal_times must be object");
      ["coffee", "lunch", "dinner"].forEach((k) => {
        if (usual_meal_times[k] !== undefined) {
          assertString(usual_meal_times[k], `client_profile_signals.usual_meal_times.${k}`);
        }
      });
    }

    if (food_preferences !== undefined && food_preferences !== null) {
      assert(isObject(food_preferences), "client_profile_signals.food_preferences must be object");
      ["coffee", "bakery", "ramen", "salads", "wine_bars", "gelato"].forEach((k) => {
        if (food_preferences[k] !== undefined) {
          assert(
            typeof food_preferences[k] === "boolean",
            `client_profile_signals.food_preferences.${k} must be boolean`,
          );
        }
      });
    }

    if (packet.client_profile_signals.preferred_cuisines !== undefined) {
      assert(
        Array.isArray(packet.client_profile_signals.preferred_cuisines),
        "client_profile_signals.preferred_cuisines must be an array",
      );
      packet.client_profile_signals.preferred_cuisines.forEach((item, idx) => {
        assertString(item, `client_profile_signals.preferred_cuisines[${idx}]`);
      });
    }

    if (packet.client_profile_signals.dietary_restrictions !== undefined) {
      const allowedDietary = [
        "vegan",
        "vegetarian",
        "gluten_free",
        "halal",
        "kosher",
        "nut_free",
        "dairy_free",
        "low_sugar",
      ];
      assert(
        Array.isArray(packet.client_profile_signals.dietary_restrictions),
        "client_profile_signals.dietary_restrictions must be an array",
      );
      packet.client_profile_signals.dietary_restrictions.forEach((item, idx) => {
        assertString(item, `client_profile_signals.dietary_restrictions[${idx}]`);
        assert(
          allowedDietary.includes(item),
          `client_profile_signals.dietary_restrictions[${idx}] must be one of: ${allowedDietary.join(", ")}`,
        );
      });
    }

    if (location_access !== undefined && location_access !== null) {
      assert(isObject(location_access), "client_profile_signals.location_access must be object");
      if (location_access.precise_location !== undefined) {
        assert(
          typeof location_access.precise_location === "boolean",
          "client_profile_signals.location_access.precise_location must be boolean",
        );
      }
      if (location_access.background_location !== undefined) {
        assert(
          typeof location_access.background_location === "boolean",
          "client_profile_signals.location_access.background_location must be boolean",
        );
      }
    }
  }

  if (packet.context_snapshot !== undefined) {
    assert(isObject(packet.context_snapshot), "context_snapshot must be an object");
    if (packet.context_snapshot.now_utc !== undefined) {
      assertString(packet.context_snapshot.now_utc, "context_snapshot.now_utc");
    }
    if (packet.context_snapshot.local_hour !== undefined) {
      assert(
        Number.isInteger(packet.context_snapshot.local_hour),
        "context_snapshot.local_hour must be integer",
      );
    }
    if (packet.context_snapshot.local_time_bucket !== undefined) {
      assertString(packet.context_snapshot.local_time_bucket, "context_snapshot.local_time_bucket");
    }
    if (packet.context_snapshot.weather_summary !== undefined) {
      assertString(packet.context_snapshot.weather_summary, "context_snapshot.weather_summary");
    }
    if (
      packet.context_snapshot.temperature_c !== undefined &&
      packet.context_snapshot.temperature_c !== null
    ) {
      assert(
        isFiniteNumber(packet.context_snapshot.temperature_c),
        "context_snapshot.temperature_c must be numeric or null",
      );
    }
    if (packet.context_snapshot.event_intensity !== undefined) {
      assertString(packet.context_snapshot.event_intensity, "context_snapshot.event_intensity");
    }
    if (packet.context_snapshot.events !== undefined) {
      assert(Array.isArray(packet.context_snapshot.events), "context_snapshot.events must be an array");
      packet.context_snapshot.events.forEach((item, idx) => {
        assert(isObject(item), `context_snapshot.events[${idx}] must be object`);
        assertString(item.title, `context_snapshot.events[${idx}].title`);
        assertString(item.category, `context_snapshot.events[${idx}].category`);
      });
    }
  }

  if (packet.intent_source !== undefined) {
    assertEnum(packet.intent_source, "intent_source", INTENT_SOURCES);
  }

  if (packet.intent_model !== undefined) {
    assertString(packet.intent_model, "intent_model");
  }

  return packet;
}

function validateOfferCard(offer) {
  assert(isObject(offer), "offer must be an object");
  assertString(offer.offer_idempotency_key, "offer_idempotency_key");
  assertString(offer.headline, "headline");
  assertString(offer.body_line, "body_line");
  assertString(offer.cta_text, "cta_text");
  assertEnum(offer.discount_type, "discount_type", DISCOUNT_TYPES);
  assert(isFiniteNumber(offer.discount_value), "discount_value must be numeric");
  assert(offer.discount_value >= 0 && offer.discount_value <= 25, "discount_value must be 0..25");
  assert(Number.isInteger(offer.valid_for_minutes), "valid_for_minutes must be integer");
  assert(offer.valid_for_minutes >= 5 && offer.valid_for_minutes <= 60, "valid_for_minutes must be 5..60");
  assertEnum(offer.tone_style, "tone_style", OFFER_TONE_STYLES);
  assert(offer.headline.length <= 64, "headline must be <= 64 characters");
  assert(offer.body_line.length <= 90, "body_line must be <= 90 characters");
  return offer;
}

function validateDecisionEvent(event) {
  assert(isObject(event), "decision event must be object");
  assertString(event.event_id, "event_id");
  assertString(event.offer_id, "offer_id");
  assertString(event.user_pseudonym, "user_pseudonym");
  assertString(event.timestamp_utc, "timestamp_utc");
  assertEnum(event.decision, "decision", DECISION_TYPES);
  assertString(event.model_version, "model_version");
  assertString(event.prompt_version, "prompt_version");
  return event;
}

module.exports = {
  INTENT_LABELS,
  RECEPTIVITY_LEVELS,
  MOBILITY_MODES,
  SENSITIVITY_LEVELS,
  TONE_PREFERENCES,
  OFFER_TONE_STYLES,
  INTENT_SOURCES,
  validateConsentMask,
  validateLocalityLimiter,
  validateIntentPacket,
  validateOfferCard,
  validateDecisionEvent,
};
