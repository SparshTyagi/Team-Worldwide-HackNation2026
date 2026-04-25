"use strict";

const { collectContext } = require("../context/collector.js");
const { buildLocalityLimiter } = require("../context/locality.js");
const { applyConsentGates } = require("../policy/consent-gate.js");
const { classifyIntent } = require("../intent/engine.js");
const {
  validateIntentPacket,
  validateOfferCard,
  validateDecisionEvent,
} = require("../contracts/schemas.js");
const { withRetry } = require("./retry.js");
const { callOfferProxy } = require("./proxy-client.js");
const { fallbackOfferFromIntent } = require("./fallback.js");
const { BrainMetrics } = require("../observability/metrics.js");

function uuid(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

function resolveSensitivityLevel(profile = {}, consentMask = {}) {
  if (profile.sensitivity_level) return profile.sensitivity_level;
  if (!consentMask.precise_location || !consentMask.background_location) return "low";
  return "medium";
}

class ClientBrain {
  constructor({ secureStore, proxyConfig }) {
    this.store = secureStore;
    this.proxyConfig = proxyConfig;
    this.metrics = new BrainMetrics();
    this.modelVersion = "nvidia/nemotron-3-super:free";
    this.promptVersion = "offer_prompt_v1";
  }

  async buildIntentPacket({
    userPseudonym,
    consentMask,
    profile,
    rawFeatures,
    interactionStats,
  }) {
    const start = Date.now();
    const context = collectContext(rawFeatures);
    const gatedFeatures = applyConsentGates({ features: rawFeatures, consentMask });
    const locality = buildLocalityLimiter({
      lat: gatedFeatures.lat,
      lon: gatedFeatures.lon,
      radius_km: 2,
      include_area_cells: true,
      nearby_merchant_ids: gatedFeatures.nearby_merchant_ids || [],
    });
    const intent = classifyIntent({
      context,
      profile,
      interaction: interactionStats,
    });

    const packet = {
      intent_id: uuid("intent"),
      timestamp_utc: new Date().toISOString(),
      user_pseudonym: userPseudonym,
      intent_label: intent.intent_label,
      intent_confidence: intent.intent_confidence,
      receptivity_level: intent.receptivity_level,
      time_budget_minutes: profile.time_budget_minutes || 15,
      mobility_mode: context.movement_state,
      sensitivity_level: resolveSensitivityLevel(profile, consentMask),
      tone_preference: intent.tone_preference,
      hard_constraints: profile.hard_constraints || [],
      locality,
      channel_hint: gatedFeatures.channel_hint || intent.channel_hint,
    };

    validateIntentPacket(packet);
    this.metrics.record("intent_inference_latency_ms", Date.now() - start, {
      intent_label: packet.intent_label,
    });
    this.metrics.record("intent_confidence", packet.intent_confidence, {
      intent_label: packet.intent_label,
    });
    return packet;
  }

  async generateOffer({ intentPacket }) {
    const start = Date.now();
    let offer;
    let usedFallback = false;
    try {
      const response = await withRetry(
        () =>
          callOfferProxy({
            baseUrl: this.proxyConfig.baseUrl,
            authToken: this.proxyConfig.authToken,
            body: {
              intent_packet: intentPacket,
              model: this.modelVersion,
              prompt_version: this.promptVersion,
            },
          }),
        { maxAttempts: 3, baseDelayMs: 250 },
      );

      offer = {
        ...response.offer,
        model_version: response.model_version || this.modelVersion,
        prompt_version: response.prompt_version || this.promptVersion,
      };
      validateOfferCard(offer);
    } catch (error) {
      this.metrics.record("offer_generation_error", 1, {
        message: String(error && error.message ? error.message : "unknown_error"),
      });
      offer = fallbackOfferFromIntent(intentPacket);
      usedFallback = true;
      validateOfferCard(offer);
    }

    this.metrics.record("llm_generation_latency_ms", Date.now() - start, {
      used_fallback: String(usedFallback),
    });
    this.metrics.record("fallback_rate", usedFallback ? 1 : 0);
    return offer;
  }

  async createDecisionEvent({ offerId, userPseudonym, decision }) {
    const event = {
      event_id: uuid("evt"),
      offer_id: offerId,
      user_pseudonym: userPseudonym,
      timestamp_utc: new Date().toISOString(),
      decision,
      model_version: this.modelVersion,
      prompt_version: this.promptVersion,
    };
    validateDecisionEvent(event);
    return event;
  }

  getMetricsSnapshot() {
    return {
      intentLatency: this.metrics.summary("intent_inference_latency_ms"),
      generationLatency: this.metrics.summary("llm_generation_latency_ms"),
      confidence: this.metrics.summary("intent_confidence"),
      fallback: this.metrics.summary("fallback_rate"),
    };
  }
}

module.exports = { ClientBrain };
