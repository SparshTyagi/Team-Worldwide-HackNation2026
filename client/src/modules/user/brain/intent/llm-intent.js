"use strict";

const { callOpenRouter } = require("../../ai/openrouter-client.js");
const { withRetry } = require("../orchestration/retry.js");
const { RECEPTIVITY_LEVELS, TONE_PREFERENCES } = require("../contracts/schemas.js");

const INTENT_SYSTEM_PROMPT = `
You classify a user's immediate city-wallet intent.
Return only strict JSON, no prose.
Use all available profile and context signals.
Respect food preferences, preferred cuisines, and dietary restrictions.
`;

const DEFAULT_INTENT_MODEL = "nvidia/nemotron-3-nano-4b";
const DEFAULT_OLLAMA_MODEL = "nemotron-3-nano:4b";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";

function extractFirstJsonObject(text) {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function clamp01(value, fallback = 0.55) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return Number(numeric.toFixed(2));
}

function sanitizeModelIntent(raw = {}) {
  const out = {
    intent_label:
      typeof raw.intent_label === "string" && raw.intent_label.trim().length
        ? raw.intent_label.trim()
        : null,
    intent_confidence: clamp01(raw.intent_confidence),
    receptivity_level: RECEPTIVITY_LEVELS.includes(raw.receptivity_level)
      ? raw.receptivity_level
      : "medium",
    tone_preference: TONE_PREFERENCES.includes(raw.tone_preference) ? raw.tone_preference : "friendly",
  };
  if (typeof raw.channel_hint === "string") out.channel_hint = raw.channel_hint;
  if (Array.isArray(raw.hard_constraints)) {
    out.hard_constraints = raw.hard_constraints
      .filter((x) => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return out;
}

function buildIntentUserPrompt({ context, normalizedProfile, interactionStats, fallbackIntent }) {
  return `
Classify a single intent packet for this user state.

Context:
${JSON.stringify(context, null, 2)}

Profile:
${JSON.stringify(normalizedProfile, null, 2)}

Interaction:
${JSON.stringify(interactionStats || {}, null, 2)}

Fallback heuristic intent:
${JSON.stringify(fallbackIntent, null, 2)}

Return strict JSON with:
{
  "intent_label": string,
  "intent_confidence": number (0..1),
  "receptivity_level": "low"|"medium"|"high",
  "tone_preference": "factual"|"emotional"|"neutral"|"minimal"|"friendly"|"playful",
  "channel_hint": "push"|"in_app_only"|"in_app"|"widget",
  "hard_constraints": string[]
}
`;
}

async function callOllamaLocal({ baseUrl, model, systemPrompt, userPrompt, timeoutMs = 9000 }) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      options: {
        temperature: 0.1,
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutHandle));

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function inferIntentWithLlm({
  context,
  normalizedProfile,
  interactionStats,
  fallbackIntent,
  proxyBaseUrl,
  proxySessionToken,
  env = process.env,
}) {
  const provider = (env.INTENT_MODEL_PROVIDER || "").toLowerCase();
  const useOllama =
    provider === "ollama" ||
    provider === "local" ||
    Boolean(env.OLLAMA_INTENT_MODEL) ||
    Boolean(env.OLLAMA_BASE_URL);
  const prompt = buildIntentUserPrompt({
    context,
    normalizedProfile,
    interactionStats,
    fallbackIntent,
  }).trim();
  let rawText = "";
  let resolvedModel = "";

  if (useOllama) {
    const model = env.OLLAMA_INTENT_MODEL || DEFAULT_OLLAMA_MODEL;
    const baseUrl = env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
    const completion = await withRetry(
      () =>
        callOllamaLocal({
          baseUrl,
          model,
          systemPrompt: INTENT_SYSTEM_PROMPT.trim(),
          userPrompt: prompt,
          timeoutMs: 12000,
        }),
      { maxAttempts: 2, baseDelayMs: 250 },
    );
    rawText = completion?.message?.content?.trim() || "";
    resolvedModel = model;
  } else {
    const model =
      env.OPENROUTER_INTENT_MODEL ||
      env.OPENROUTER_INTENT_SMALL_MODEL ||
      DEFAULT_INTENT_MODEL;
    if (!env.OPENROUTER_API_KEY && !(proxyBaseUrl && proxySessionToken)) {
      return null;
    }
    const completion = await withRetry(
      () =>
        callOpenRouter({
          apiKey: env.OPENROUTER_API_KEY,
          proxyBaseUrl,
          sessionToken: proxySessionToken,
          model,
          systemPrompt: INTENT_SYSTEM_PROMPT.trim(),
          userPrompt: prompt,
          temperature: 0.1,
          maxTokens: 350,
          timeoutMs: 9000,
        }),
      { maxAttempts: 2, baseDelayMs: 250 },
    );
    rawText = completion?.choices?.[0]?.message?.content?.trim() || "";
    resolvedModel = model;
  }

  const jsonText = extractFirstJsonObject(rawText || "");
  if (!jsonText) return null;

  const parsed = JSON.parse(jsonText);
  const normalized = sanitizeModelIntent(parsed);
  if (!normalized.intent_label) return null;
  normalized.model = resolvedModel;
  return normalized;
}

module.exports = {
  DEFAULT_INTENT_MODEL,
  inferIntentWithLlm,
};
