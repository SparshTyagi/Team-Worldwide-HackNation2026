"use strict";

const { INTENT_LABELS, RECEPTIVITY_LEVELS, TONE_PREFERENCES } = require("../contracts/schemas.js");

const DEFAULT_ONNX_MODEL_PATH = "models/intent/intent_classifier.onnx";
const SESSION_CACHE = new Map();

function clamp01(value, fallback = 0.55) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return Number(numeric.toFixed(2));
}

function normalizeTonePreference(profile = {}) {
  const tone = typeof profile.offer_tone === "string" ? profile.offer_tone : "friendly";
  return TONE_PREFERENCES.includes(tone) ? tone : "friendly";
}

function deriveReceptivity(confidence, fatigueScore) {
  if (confidence >= 0.75 && fatigueScore < 0.5) return "high";
  if (confidence < 0.6 || fatigueScore >= 0.65) return "low";
  return "medium";
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - max));
  const sum = exps.reduce((acc, x) => acc + x, 0) || 1;
  return exps.map((x) => x / sum);
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function getTimeBucketCode(timeBucket) {
  const map = {
    morning: 0,
    lunch: 1,
    afternoon: 2,
    evening: 3,
  };
  return map[timeBucket] ?? 4;
}

function getMovementCode(movementState) {
  const map = {
    stationary: 0,
    walking: 1,
    transit: 2,
  };
  return map[movementState] ?? 0;
}

function buildFeatureVector({ context = {}, normalizedProfile = {}, interactionStats = {}, fallbackIntent = {} }) {
  const preferences = normalizedProfile.food_preferences || {};
  const locationAccess = normalizedProfile.location_access || {};
  const delivered = Math.max(1, toNumber(interactionStats.delivered_count_7d, 1));
  const dismissed = toNumber(interactionStats.dismiss_count_7d, 0);
  const accepted = toNumber(interactionStats.accept_count_7d, 0);
  const fatigueRate = dismissed / delivered;

  return [
    toNumber(context.local_hour, 12) / 23,
    getTimeBucketCode(context.time_bucket) / 4,
    getMovementCode(context.movement_state) / 2,
    clamp01((toNumber(context.stop_count_15m, 0) || 0) / 12, 0),
    clamp01((toNumber(context.speed_mps, 0) || 0) / 15, 0),
    clamp01((toNumber(normalizedProfile.time_budget_minutes, 15) || 15) / 120, 0.125),
    preferences.coffee ? 1 : 0,
    preferences.ramen ? 1 : 0,
    preferences.salads ? 1 : 0,
    preferences.gelato ? 1 : 0,
    locationAccess.precise_location === false ? 0 : 1,
    locationAccess.background_location === false ? 0 : 1,
    clamp01(fatigueRate, 0),
    clamp01(accepted / delivered, 0),
    clamp01(fallbackIntent.intent_confidence, 0.55),
    clamp01(fallbackIntent.receptivity_level === "high" ? 1 : fallbackIntent.receptivity_level === "low" ? 0 : 0.5, 0.5),
  ];
}

async function resolveOrtRuntime() {
  // In Node.js, prefer onnxruntime-node for local file model loading.
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      return require("onnxruntime-node");
    } catch {
      try {
        return require("onnxruntime-web");
      } catch {
        return null;
      }
    }
  }
  try {
    return require("onnxruntime-web");
  } catch {
    try {
      return require("onnxruntime-node");
    } catch {
      return null;
    }
  }
}

function getCacheKey(modelPath) {
  return String(modelPath || DEFAULT_ONNX_MODEL_PATH);
}

async function getOrCreateSession(ort, modelPath) {
  const cacheKey = getCacheKey(modelPath);
  if (SESSION_CACHE.has(cacheKey)) {
    return SESSION_CACHE.get(cacheKey);
  }

  // Let runtime pick defaults (cpu for node runtime, wasm/webgl for web runtime).
  const sessionPromise = ort.InferenceSession.create(modelPath, {
    graphOptimizationLevel: "all",
  });
  SESSION_CACHE.set(cacheKey, sessionPromise);
  return sessionPromise;
}

function pickFirstTensor(runOutput = {}) {
  const first = Object.values(runOutput)[0];
  if (!first || !first.data) return null;
  return first;
}

function isOnnxPreferred(env = process.env) {
  const provider = String(env.INTENT_MODEL_PROVIDER || "").toLowerCase();
  return provider === "onnx" || provider === "edge" || provider === "embedded";
}

async function inferIntentWithOnnx({
  context,
  normalizedProfile,
  interactionStats,
  fallbackIntent,
  env = process.env,
}) {
  if (!isOnnxPreferred(env) && !env.INTENT_ONNX_MODEL_PATH) return null;

  const ort = await resolveOrtRuntime();
  if (!ort) return null;

  const modelPath = env.INTENT_ONNX_MODEL_PATH || DEFAULT_ONNX_MODEL_PATH;
  const inputName = env.INTENT_ONNX_INPUT_NAME || "input";

  try {
    const session = await getOrCreateSession(ort, modelPath);
    const features = buildFeatureVector({
      context,
      normalizedProfile,
      interactionStats,
      fallbackIntent,
    });
    const tensor = new ort.Tensor("float32", Float32Array.from(features), [1, features.length]);
    const output = await session.run({ [inputName]: tensor });
    const logitsTensor = pickFirstTensor(output);
    if (!logitsTensor || !Array.isArray(INTENT_LABELS) || INTENT_LABELS.length === 0) return null;

    const logits = Array.from(logitsTensor.data || []);
    if (!logits.length) return null;
    const probabilities = softmax(logits);
    let maxIndex = 0;
    let maxProbability = probabilities[0] || 0;

    for (let index = 1; index < probabilities.length; index += 1) {
      if (probabilities[index] > maxProbability) {
        maxProbability = probabilities[index];
        maxIndex = index;
      }
    }

    const intentLabel = INTENT_LABELS[maxIndex] || fallbackIntent.intent_label || "browse_local_shops";
    const confidence = clamp01(maxProbability, fallbackIntent.intent_confidence || 0.55);
    const fatigueScore = clamp01(
      toNumber(interactionStats.dismiss_count_7d, 0) /
        Math.max(1, toNumber(interactionStats.delivered_count_7d, 1)),
      0,
    );
    const receptivityLevel = deriveReceptivity(confidence, fatigueScore);
    const safeReceptivity = RECEPTIVITY_LEVELS.includes(receptivityLevel)
      ? receptivityLevel
      : fallbackIntent.receptivity_level || "medium";

    return {
      intent_label: intentLabel,
      intent_confidence: confidence,
      receptivity_level: safeReceptivity,
      tone_preference: normalizeTonePreference(normalizedProfile),
      channel_hint: fatigueScore > 0.75 ? "in_app_only" : "push",
      model: `onnx:${modelPath}`,
    };
  } catch {
    return null;
  }
}

module.exports = {
  DEFAULT_ONNX_MODEL_PATH,
  inferIntentWithOnnx,
  isOnnxPreferred,
};
