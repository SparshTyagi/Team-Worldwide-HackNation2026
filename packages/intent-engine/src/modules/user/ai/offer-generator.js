const { callOpenRouter } = require("./openrouter-client.js");
const { validateOfferCard } = require("../brain/contracts/schemas.js");
const { withRetry } = require("../brain/orchestration/retry.js");
const { fallbackOfferFromIntent } = require("../brain/orchestration/fallback.js");

const OFFER_SYSTEM_PROMPT = `
You generate one city-wallet offer in strict JSON.
Return only valid JSON with this shape:
{
  "headline": "string",
  "body_line": "string",
  "cta_text": "string",
  "discount_type": "percent|fixed",
  "discount_value": number,
  "valid_for_minutes": number,
  "tone_style": "factual|friendly|minimal|playful"
}
`;

function resolveOfferModel(env = {}) {
  return (
    env.OPENROUTER_OFFER_MODEL ||
    env.OPENROUTEROFFERMODEL ||
    "nvidia/nemotron-3-super:free"
  );
}

/**
 * contextInput example:
 * {
 *   weather: "11C overcast",
 *   intent_label: "warm_break_seek",
 *   merchant_category: "cafe",
 *   distance_meters: 120
 * }
 */
async function generateOfferCard({ env, contextInput }) {
  const model = resolveOfferModel(env);
  const promptVersion = "offer_prompt_v1";
  const proxyBaseUrl = env.OPENROUTER_PROXY_BASE_URL;
  const proxySessionToken = env.OPENROUTER_PROXY_SESSION_TOKEN;

  const userPrompt = `
Generate a single local offer for this context:
${JSON.stringify(contextInput, null, 2)}

Constraints:
- Keep headline <= 64 characters
- Keep body_line <= 90 characters
- discount_value <= 25
- valid_for_minutes between 5 and 60
`;

  let raw = "";
  let parsed;
  let usedFallback = false;
  try {
    const completion = await withRetry(
      () =>
        callOpenRouter({
          apiKey: env.OPENROUTER_API_KEY,
          proxyBaseUrl,
          sessionToken: proxySessionToken,
          model,
          systemPrompt: OFFER_SYSTEM_PROMPT.trim(),
          userPrompt: userPrompt.trim(),
          timeoutMs: 9000,
        }),
      { maxAttempts: 3, baseDelayMs: 250 },
    );

    raw = completion?.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      throw new Error("Empty model response");
    }
    parsed = JSON.parse(raw);
    parsed.offer_idempotency_key = parsed.offer_idempotency_key || `offer_${Date.now()}`;
    validateOfferCard(parsed);
  } catch {
    parsed = fallbackOfferFromIntent({
      intent_label: contextInput.intent_label || "browse_local_shops",
    });
    raw = JSON.stringify(parsed);
    usedFallback = true;
  }

  return {
    model,
    model_version: model,
    prompt_version: promptVersion,
    used_fallback: usedFallback,
    offer: parsed,
    raw,
  };
}

module.exports = { generateOfferCard };
