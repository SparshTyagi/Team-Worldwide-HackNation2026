"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { classifyIntent, computeFatigueScore } = require("../intent/engine.js");

test("classifier returns lunch intent for lunch context", () => {
  const result = classifyIntent({
    context: {
      time_bucket: "lunch",
      movement_state: "walking",
      weather_summary: "clear",
    },
    profile: { offer_tone: "friendly" },
    interaction: { delivered_count_7d: 10, dismiss_count_7d: 2, accept_count_7d: 4 },
  });

  assert.equal(result.intent_label, "quick_lunch_now");
  assert.equal(result.receptivity_level, "high");
});

test("classifier suppresses push under high fatigue", () => {
  const result = classifyIntent({
    context: {
      time_bucket: "afternoon",
      movement_state: "stationary",
      weather_summary: "clear",
    },
    profile: { offer_tone: "friendly" },
    interaction: { delivered_count_7d: 10, dismiss_count_7d: 9, accept_count_7d: 0 },
  });

  assert.equal(result.intent_label, "low_receptivity_do_not_push");
  assert.equal(result.channel_hint, "in_app_only");
});

test("fatigue score is bounded to 0..1", () => {
  const score = computeFatigueScore({ delivered_count_7d: 5, dismiss_count_7d: 20 });
  assert.equal(score, 1);
});
