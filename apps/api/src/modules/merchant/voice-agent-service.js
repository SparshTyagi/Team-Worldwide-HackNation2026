import { config } from "../../config.js";
import { supabase } from "../../db/supabase.js";

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanList(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => cleanText(value))
    .filter(Boolean);
}

function normalizeVoiceIdentityPayload(payload = {}) {
  return {
    brand_story: cleanText(payload.brand_story),
    menu_highlights: cleanList(payload.menu_highlights),
    promotions: cleanList(payload.promotions),
    voice_name: cleanText(payload.voice_name),
    voice_id: cleanText(payload.voice_id),
    tone: cleanText(payload.tone),
    language: cleanText(payload.language),
  };
}

function toOutputIdentity(record) {
  if (!record) return undefined;
  return {
    brand_story: record.brand_story || "",
    menu_highlights: Array.isArray(record.menu_highlights) ? record.menu_highlights : [],
    promotions: Array.isArray(record.promotions) ? record.promotions : [],
    voice_name: record.voice_name || "",
    voice_id: record.voice_id || "",
    tone: record.tone || "",
    language: record.language || "",
  };
}

async function fetchVoiceIdentityRecord(merchantId) {
  const { data, error } = await supabase
    .from("voice_agent_identities")
    .select("*")
    .eq("merchant_id", merchantId)
    .maybeSingle();
  if (error) throw new Error(`Supabase Error: ${error.message}`);
  return data;
}

async function persistVoiceIdentity(merchantId, payload) {
  const normalized = normalizeVoiceIdentityPayload(payload);
  const hasData =
    normalized.brand_story ||
    normalized.menu_highlights.length ||
    normalized.promotions.length ||
    normalized.voice_name ||
    normalized.voice_id ||
    normalized.tone ||
    normalized.language;
  if (!hasData) {
    throw new Error("At least one voice identity field must be provided.");
  }

  const record = {
    merchant_id: merchantId,
    ...normalized,
    updated_at: nowIso(),
  };

  const { data, error } = await supabase
    .from("voice_agent_identities")
    .upsert(record, { onConflict: "merchant_id" })
    .select("*")
    .single();
  if (error) throw new Error(`Supabase Error: ${error.message}`);

  return {
    merchant_id: merchantId,
    status: "saved",
    updated_at_utc: data.updated_at || nowIso(),
    identity: toOutputIdentity(data),
  };
}

export async function createVoiceIdentity(merchantId, payload) {
  return persistVoiceIdentity(merchantId, payload);
}

export async function updateVoiceIdentity(merchantId, patch) {
  const current = await fetchVoiceIdentityRecord(merchantId);
  const merged = {
    brand_story: patch.brand_story ?? current?.brand_story,
    menu_highlights: patch.menu_highlights ?? current?.menu_highlights,
    promotions: patch.promotions ?? current?.promotions,
    voice_name: patch.voice_name ?? current?.voice_name,
    voice_id: patch.voice_id ?? current?.voice_id,
    tone: patch.tone ?? current?.tone,
    language: patch.language ?? current?.language,
  };
  return persistVoiceIdentity(merchantId, merged);
}

export async function getVoiceIdentity(merchantId) {
  const record = await fetchVoiceIdentityRecord(merchantId);
  if (!record) {
    return {
      merchant_id: merchantId,
      status: "not_configured",
      updated_at_utc: nowIso(),
    };
  }

  return {
    merchant_id: merchantId,
    status: "saved",
    updated_at_utc: record.updated_at || nowIso(),
    identity: toOutputIdentity(record),
  };
}

async function fetchElevenLabsToken(payload) {
  const response = await fetch(`${config.elevenLabsBaseUrl}/convai/conversation/token`, {
    method: "POST",
    headers: {
      "xi-api-key": config.elevenLabsApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail?.message || data?.message || "Failed to create ElevenLabs session token.");
  }
  return data;
}

async function fetchElevenLabsSignedUrl(agentId) {
  const query = new URLSearchParams({ agent_id: agentId });
  const response = await fetch(
    `${config.elevenLabsBaseUrl}/convai/conversation/get-signed-url?${query.toString()}`,
    {
      method: "GET",
      headers: {
        "xi-api-key": config.elevenLabsApiKey,
      },
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.detail?.message || data?.message || "Failed to create ElevenLabs signed launch URL.",
    );
  }
  return data;
}

async function fetchMerchantRecord(merchantId) {
  const { data, error } = await supabase
    .from("merchants")
    .select("name, category, business_hours")
    .eq("id", merchantId)
    .maybeSingle();
  if (error) throw new Error(`Supabase Error: ${error.message}`);
  return data;
}

function buildFallbackVoiceIdentity(merchantRecord) {
  const merchantName = merchantRecord?.name || "our shop";
  const category = merchantRecord?.category || "local spot";
  const cuisine = merchantRecord?.business_hours?.cuisine || category;
  const discountEvents = Array.isArray(merchantRecord?.business_hours?.discount_events)
    ? merchantRecord.business_hours.discount_events
    : [];
  return {
    brand_story: `You are the sales voice for ${merchantName}, a ${category} known for ${cuisine}. Share what makes this merchant unique and why customers should visit today.`,
    menu_highlights: [cuisine, "seasonal specials"],
    promotions: discountEvents.length ? discountEvents : ["time-limited in-app offers"],
    tone: "warm, persuasive, premium local storyteller",
    language: "en",
  };
}

export async function createVoiceSessionToken(merchantId) {
  if (!config.elevenLabsApiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing.");
  }
  if (!config.elevenLabsAgentId) {
    throw new Error("ELEVENLABS_AGENT_ID is missing.");
  }

  const voiceIdentity = await fetchVoiceIdentityRecord(merchantId);
  const merchantRecord = await fetchMerchantRecord(merchantId);
  const resolvedIdentity = voiceIdentity || buildFallbackVoiceIdentity(merchantRecord);

  const tokenResponse = await fetchElevenLabsToken({
    agent_id: config.elevenLabsAgentId,
    external_user_id: merchantId,
    dynamic_variables: {
      brand_story: resolvedIdentity.brand_story || "",
      tone: resolvedIdentity.tone || "",
      language: resolvedIdentity.language || "",
      menu_highlights: Array.isArray(resolvedIdentity.menu_highlights)
        ? resolvedIdentity.menu_highlights.join(", ")
        : "",
      promotions: Array.isArray(resolvedIdentity.promotions)
        ? resolvedIdentity.promotions.join(", ")
        : "",
    },
  });

  const sessionToken =
    tokenResponse?.token || tokenResponse?.session_token || tokenResponse?.conversation_token || null;
  let signedUrl = tokenResponse?.signed_url || tokenResponse?.url || null;
  if (!signedUrl) {
    try {
      const signedResponse = await fetchElevenLabsSignedUrl(config.elevenLabsAgentId);
      signedUrl = signedResponse?.signed_url || null;
    } catch (error) {
      console.warn(
        "ElevenLabs signed URL generation failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  if (!sessionToken && !signedUrl) {
    throw new Error("ElevenLabs response did not include a usable session token.");
  }

  return {
    merchant_id: merchantId,
    agent_id: config.elevenLabsAgentId,
    provider: "elevenlabs",
    created_at_utc: nowIso(),
    expires_at_utc: tokenResponse?.expires_at || tokenResponse?.expires_at_utc || undefined,
    session_token: sessionToken || undefined,
    signed_url: signedUrl || undefined,
  };
}
