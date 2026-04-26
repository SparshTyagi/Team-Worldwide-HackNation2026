"use strict";

const { collectContext } = require("../context/collector.js");
const { buildLocalityLimiter } = require("../context/locality.js");
const { applyConsentGates } = require("../policy/consent-gate.js");
const { classifyIntent } = require("../intent/engine.js");
const { DEFAULT_INTENT_MODEL, inferIntentWithLlm } = require("../intent/llm-intent.js");
const { DEFAULT_ONNX_MODEL_PATH, inferIntentWithOnnx, isOnnxPreferred } = require("../intent/onnx-intent.js");
const {
  validateIntentPacket,
  validateOfferCard,
  validateDecisionEvent,
} = require("../contracts/schemas.js");
const { withRetry } = require("./retry.js");
const { callOfferProxy } = require("./proxy-client.js");
const { fallbackOfferFromIntent } = require("./fallback.js");
const { BrainMetrics } = require("../observability/metrics.js");
const {
  normalizeClientProfile,
  profileSignalsForIntent,
} = require("../profile/client-profile.js");

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

function buildHardConstraints(profile = {}) {
  const explicit = Array.isArray(profile.hard_constraints) ? profile.hard_constraints : [];
  const dietary = Array.isArray(profile.dietary_restrictions)
    ? profile.dietary_restrictions.map((x) => `dietary_${x}`)
    : [];
  return [...new Set([...explicit, ...dietary])];
}

function buildContextSnapshot(context = {}) {
  const events = Array.isArray(context.events)
    ? context.events
        .map((event) => {
          if (!event || typeof event !== "object") return null;
          const title =
            typeof event.title === "string" && event.title.length
              ? event.title
              : typeof event.name === "string"
                ? event.name
                : null;
          const category = typeof event.category === "string" ? event.category : null;
          if (!title && !category) return null;
          return {
            title: title || "event",
            category: category || "general",
          };
        })
        .filter(Boolean)
    : [];

  return {
    now_utc: context.now_utc || new Date().toISOString(),
    local_hour: context.local_hour,
    local_time_bucket: context.time_bucket,
    weather_summary: context.weather_summary || "unknown",
    temperature_c: Number.isFinite(context.temperature_c) ? context.temperature_c : undefined,
    event_intensity: context.event_intensity || "low",
    events,
  };
}

class ClientBrain {
  constructor({ secureStore, proxyConfig }) {
    this.store = secureStore;
    this.proxyConfig = proxyConfig;
    this.metrics = new BrainMetrics();
    this.modelVersion = "nvidia/nemotron-3-super:free";
    this.intentModelVersion =
      process.env.INTENT_ONNX_MODEL_PATH ||
      process.env.OLLAMA_INTENT_MODEL ||
      process.env.OPENROUTER_INTENT_MODEL ||
      process.env.OPENROUTER_INTENT_SMALL_MODEL ||
      DEFAULT_INTENT_MODEL;
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
    const normalizedProfile = normalizeClientProfile(profile || {}, consentMask || {});
    await this.store.setItem(`brain:profile:${userPseudonym}`, normalizedProfile);
    const context = collectContext(rawFeatures);
    const gatedFeatures = applyConsentGates({ features: rawFeatures, consentMask });
    const locality = buildLocalityLimiter({
      lat: gatedFeatures.lat,
      lon: gatedFeatures.lon,
      radius_km: 2,
      include_area_cells: true,
      nearby_merchant_ids: gatedFeatures.nearby_merchant_ids || [],
    });
    const heuristicIntent = classifyIntent({
      context,
      profile: normalizedProfile,
      interaction: interactionStats,
    });
    const embeddedIntent = await inferIntentWithOnnx({
      context,
      normalizedProfile,
      interactionStats,
      fallbackIntent: heuristicIntent,
    }).catch(() => null);
    const llmIntent = await inferIntentWithLlm({
      context,
      normalizedProfile,
      interactionStats,
      fallbackIntent: heuristicIntent,
      proxyBaseUrl: this.proxyConfig?.openRouterProxyBaseUrl,
      proxySessionToken: this.proxyConfig?.openRouterProxySessionToken,
    }).catch(() => null);
    const intent = embeddedIntent || llmIntent || heuristicIntent;
    const intentSource = embeddedIntent
      ? "embedded_onnx"
      : llmIntent
        ? "local_small_model"
        : "heuristic_fallback";
    this.intentModelVersion =
      intent.model ||
      (isOnnxPreferred(process.env)
        ? process.env.INTENT_ONNX_MODEL_PATH || DEFAULT_ONNX_MODEL_PATH
        : process.env.OLLAMA_INTENT_MODEL ||
          process.env.OPENROUTER_INTENT_MODEL ||
          process.env.OPENROUTER_INTENT_SMALL_MODEL ||
          DEFAULT_INTENT_MODEL);
    const mergedHardConstraints = [
      ...buildHardConstraints(normalizedProfile),
      ...(Array.isArray(intent?.hard_constraints) ? intent.hard_constraints : []),
    ];

    const packet = {
      intent_id: uuid("intent"),
      timestamp_utc: new Date().toISOString(),
      user_pseudonym: userPseudonym,
      intent_label: intent.intent_label,
      intent_confidence: intent.intent_confidence,
      receptivity_level: intent.receptivity_level,
      time_budget_minutes: normalizedProfile.time_budget_minutes || 15,
      mobility_mode: context.movement_state,
      sensitivity_level: resolveSensitivityLevel(normalizedProfile, consentMask),
      tone_preference: intent.tone_preference,
      hard_constraints: [...new Set(mergedHardConstraints)],
      locality,
      channel_hint: gatedFeatures.channel_hint || intent.channel_hint,
      client_profile_signals: profileSignalsForIntent(normalizedProfile),
      context_snapshot: buildContextSnapshot(context),
      intent_source: intentSource,
      intent_model: this.intentModelVersion,
    };

    validateIntentPacket(packet);
    this.metrics.record("intent_inference_latency_ms", Date.now() - start, {
      intent_label: packet.intent_label,
      intent_source: intentSource,
    });
    this.metrics.record("intent_confidence", packet.intent_confidence, {
      intent_label: packet.intent_label,
      intent_source: intentSource,
    });
    this.metrics.record("intent_fallback_used", intentSource === "heuristic_fallback" ? 1 : 0, {
      intent_source: intentSource,
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
