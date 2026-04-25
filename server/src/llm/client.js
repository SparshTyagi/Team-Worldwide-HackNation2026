import { config } from "../config.js";
import { SYSTEM_PROMPT, buildTaskPrompt } from "./prompts.js";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

function deterministicFallback(input) {
  const merchant = input.merchant_profile;
  const discount = Math.min(input.constraints?.max_discount_pct || 10, 20);
  const validity = Math.min(input.constraints?.max_validity_minutes || 15, 60);

  return {
    offer_idempotency_key: `offer_${Date.now()}`,
    headline: `Nearby ${merchant.category} deal at ${merchant.merchant_id}`,
    body_line: `${discount}% off for the next ${validity} minutes.`,
    cta_text: "Claim now",
    discount_type: "percent",
    discount_value: discount,
    valid_for_minutes: validity,
    tone_style: input.intent_packet?.tone_preference || "neutral",
    ui_layout_variant: "hero_timer_compact",
    image_prompt: "friendly local storefront",
    justification: {
      why_now_factors: ["intent_match", "locality_filter"],
      merchant_goal_alignment: input.constraints?.campaign_goal || "unspecified",
    },
    risk_flags: {
      needs_human_review: false,
      safety_notes: [],
    },
  };
}

function normalizeCanonicalOfferOutput(parsed, input) {
  const fb = deterministicFallback(input);
  const maxPct = input.constraints?.max_discount_pct ?? 20;
  const maxMin = input.constraints?.max_validity_minutes ?? 30;

  let discountValue = Number(parsed.discount_value);
  if (!Number.isFinite(discountValue)) discountValue = fb.discount_value;
  discountValue = Math.min(Math.max(discountValue, 0), maxPct);

  let validMinutes = Number(parsed.valid_for_minutes);
  if (!Number.isFinite(validMinutes)) validMinutes = fb.valid_for_minutes;
  validMinutes = Math.min(Math.max(Math.floor(validMinutes), 1), maxMin);

  let justification = parsed.justification;
  if (typeof justification === "string") {
    justification = {
      why_now_factors: [justification],
      merchant_goal_alignment:
        input.constraints?.campaign_goal || fb.justification.merchant_goal_alignment,
    };
  }
  if (!justification || typeof justification !== "object") {
    justification = fb.justification;
  } else {
    const w = justification.why_now_factors;
    const align = justification.merchant_goal_alignment;
    justification = {
      why_now_factors: Array.isArray(w)
        ? w.map(String).filter(Boolean)
        : fb.justification.why_now_factors,
      merchant_goal_alignment:
        typeof align === "string" && align.length
          ? align
          : input.constraints?.campaign_goal ||
            fb.justification.merchant_goal_alignment,
    };
  }

  let riskFlags = parsed.risk_flags;
  if (!riskFlags || typeof riskFlags !== "object") {
    riskFlags = fb.risk_flags;
  } else {
    riskFlags = {
      needs_human_review: Boolean(riskFlags.needs_human_review),
      safety_notes: Array.isArray(riskFlags.safety_notes)
        ? riskFlags.safety_notes.map(String)
        : [],
    };
  }

  const base = {
    offer_idempotency_key:
      typeof parsed.offer_idempotency_key === "string" &&
      parsed.offer_idempotency_key.length
        ? parsed.offer_idempotency_key
        : fb.offer_idempotency_key,
    headline: typeof parsed.headline === "string" ? parsed.headline : fb.headline,
    body_line: typeof parsed.body_line === "string" ? parsed.body_line : fb.body_line,
    cta_text: typeof parsed.cta_text === "string" ? parsed.cta_text : fb.cta_text,
    discount_type:
      typeof parsed.discount_type === "string" ? parsed.discount_type : fb.discount_type,
    discount_value: discountValue,
    valid_for_minutes: validMinutes,
    tone_style:
      typeof parsed.tone_style === "string" ? parsed.tone_style : fb.tone_style,
    ui_layout_variant:
      typeof parsed.ui_layout_variant === "string"
        ? parsed.ui_layout_variant
        : fb.ui_layout_variant,
    image_prompt:
      typeof parsed.image_prompt === "string" ? parsed.image_prompt : fb.image_prompt,
    justification,
    risk_flags: riskFlags,
  };

  if (typeof parsed.subheadline === "string" && parsed.subheadline.length) {
    base.subheadline = parsed.subheadline;
  }
  if (typeof parsed.merchant_disclaimer === "string" && parsed.merchant_disclaimer.length) {
    base.merchant_disclaimer = parsed.merchant_disclaimer;
  }

  const co = parsed.channel_overrides;
  if (co && typeof co === "object" && !Array.isArray(co)) {
    const cleaned = {};
    if (co.push && typeof co.push === "object") {
      const h = co.push.headline;
      const b = co.push.body_line;
      if (typeof h === "string" && typeof b === "string") cleaned.push = { headline: h, body_line: b };
    }
    if (co.in_app && typeof co.in_app === "object") {
      const h = co.in_app.headline;
      const b = co.in_app.body_line;
      if (typeof h === "string" && typeof b === "string")
        cleaned.in_app = { headline: h, body_line: b };
    }
    if (Object.keys(cleaned).length) base.channel_overrides = cleaned;
  }

  return base;
}

function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
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
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

export async function generateOffer(input) {
  const promptPayload = {
    model: config.llmModel,
    system_prompt: SYSTEM_PROMPT,
    task_prompt: buildTaskPrompt(input),
  };

  if (!config.llmModel || !config.openRouterApiKey) {
    return {
      output: deterministicFallback(input),
      meta: {
        used_fallback: true,
        reason: !config.llmModel ? "llm_model_undefined" : "missing_openrouter_api_key",
        prompt_payload: promptPayload,
      },
    };
  }

  try {
    const upstream = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "https://localhost",
        "X-Title": process.env.OPENROUTER_APP_TITLE || "Generative City Wallet",
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildTaskPrompt(input) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!upstream.ok) {
      const err = await upstream.text();
      throw new Error(`openrouter_http_${upstream.status}: ${err}`);
    }
    const responseJson = await upstream.json();
    const responseText = responseJson?.choices?.[0]?.message?.content || "";
    const usage = responseJson?.usage || null;

    const jsonText = extractFirstJsonObject(responseText);
    if (!jsonText) {
      throw new Error("no_json_in_model_response");
    }

    const parsed = JSON.parse(jsonText);
    const output = normalizeCanonicalOfferOutput(parsed, input);
    return {
      output,
      meta: {
        used_fallback: false,
        model: config.llmModel,
        usage: usage || null,
        reasoning_tokens:
          usage?.completionTokensDetails?.reasoningTokens ?? null,
        prompt_payload: promptPayload,
      },
    };
  } catch (error) {
    return {
      output: deterministicFallback(input),
      meta: {
        used_fallback: true,
        reason: "openrouter_error",
        error_message: error instanceof Error ? error.message : String(error),
        prompt_payload: promptPayload,
      },
    };
  }
}
