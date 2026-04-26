"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { inferIntentWithOnnx, isOnnxPreferred } = require("../intent/onnx-intent.js");

test("isOnnxPreferred returns true for supported provider aliases", () => {
  assert.equal(isOnnxPreferred({ INTENT_MODEL_PROVIDER: "onnx" }), true);
  assert.equal(isOnnxPreferred({ INTENT_MODEL_PROVIDER: "embedded" }), true);
  assert.equal(isOnnxPreferred({ INTENT_MODEL_PROVIDER: "edge" }), true);
  assert.equal(isOnnxPreferred({ INTENT_MODEL_PROVIDER: "ollama" }), false);
});

test("inferIntentWithOnnx returns null when runtime or model is unavailable", async () => {
  const result = await inferIntentWithOnnx({
    context: { time_bucket: "lunch", movement_state: "walking", local_hour: 12 },
    normalizedProfile: { offer_tone: "friendly", food_preferences: {} },
    interactionStats: { delivered_count_7d: 3, dismiss_count_7d: 1, accept_count_7d: 1 },
    fallbackIntent: {
      intent_label: "quick_lunch_now",
      intent_confidence: 0.7,
      receptivity_level: "medium",
    },
    env: {
      INTENT_MODEL_PROVIDER: "onnx",
      INTENT_ONNX_MODEL_PATH: "./missing-model.onnx",
    },
  });

  assert.equal(result, null);
});
