"use strict";

const SUPPORTED_FOOD_PREFERENCES = [
  "coffee",
  "bakery",
  "ramen",
  "salads",
  "wine_bars",
  "gelato",
];
const FOOD_TO_CUISINE = {
  coffee: "cafe",
  bakery: "bakery",
  ramen: "japanese",
  salads: "healthy",
  wine_bars: "wine_bar",
  gelato: "dessert",
};
const SUPPORTED_DIETARY_RESTRICTIONS = [
  "vegan",
  "vegetarian",
  "gluten_free",
  "halal",
  "kosher",
  "nut_free",
  "dairy_free",
  "low_sugar",
];

function toBoolean(value) {
  return value === true;
}

function normalizeGeoLocation(location) {
  if (!location || typeof location !== "object") return null;
  const lat = Number(location.lat);
  const lon = Number(location.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    lat,
    lon,
    label: typeof location.label === "string" ? location.label : undefined,
  };
}

function normalizeTimePreference(value, fallback) {
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) return value;
  return fallback;
}

function normalizeFoodPreferences(input = {}) {
  const out = {};
  for (const key of SUPPORTED_FOOD_PREFERENCES) {
    out[key] = toBoolean(input[key]);
  }
  return out;
}

function normalizeDietaryRestrictionLabel(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return SUPPORTED_DIETARY_RESTRICTIONS.includes(normalized) ? normalized : null;
}

function normalizeDietaryRestrictions(input = []) {
  if (!Array.isArray(input)) return [];
  const mapped = input
    .map(normalizeDietaryRestrictionLabel)
    .filter((x) => typeof x === "string");
  return [...new Set(mapped)];
}

function normalizePreferredCuisines(input = [], foodPreferences = {}) {
  const explicit = Array.isArray(input)
    ? input
        .filter((x) => typeof x === "string")
        .map((x) => x.trim().toLowerCase().replace(/[\s-]+/g, "_"))
        .filter(Boolean)
    : [];
  const implied = Object.entries(FOOD_TO_CUISINE)
    .filter(([foodKey]) => foodPreferences[foodKey] === true)
    .map(([, cuisine]) => cuisine);
  return [...new Set([...explicit, ...implied])];
}

function normalizeClientProfile(profile = {}, consentMask = {}) {
  const { interests: _ignoredInterests, ...rest } = profile;
  const foodPreferences = normalizeFoodPreferences(profile.food_preferences || {});
  const dietaryRestrictions = normalizeDietaryRestrictions(profile.dietary_restrictions || []);
  const preferredCuisines = normalizePreferredCuisines(
    profile.preferred_cuisines || profile.cuisine_preferences || [],
    foodPreferences,
  );
  return {
    ...rest,
    home_location: normalizeGeoLocation(profile.home_location),
    work_location: normalizeGeoLocation(profile.work_location),
    usual_meal_times: {
      coffee: normalizeTimePreference(profile?.usual_meal_times?.coffee, "09:00"),
      lunch: normalizeTimePreference(profile?.usual_meal_times?.lunch, "12:30"),
      dinner: normalizeTimePreference(profile?.usual_meal_times?.dinner, "19:00"),
    },
    food_preferences: foodPreferences,
    dietary_restrictions: dietaryRestrictions,
    preferred_cuisines: preferredCuisines,
    location_access: {
      precise_location: toBoolean(consentMask.precise_location),
      background_location: toBoolean(consentMask.background_location),
    },
  };
}

function profileSignalsForIntent(profile = {}) {
  return {
    home_location: profile.home_location || null,
    work_location: profile.work_location || null,
    usual_meal_times: profile.usual_meal_times || null,
    food_preferences: profile.food_preferences || null,
    dietary_restrictions: Array.isArray(profile.dietary_restrictions)
      ? profile.dietary_restrictions
      : [],
    preferred_cuisines: Array.isArray(profile.preferred_cuisines) ? profile.preferred_cuisines : [],
    location_access: profile.location_access || null,
  };
}

module.exports = {
  SUPPORTED_FOOD_PREFERENCES,
  SUPPORTED_DIETARY_RESTRICTIONS,
  normalizeClientProfile,
  profileSignalsForIntent,
};
