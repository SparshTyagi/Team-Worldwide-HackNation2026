import { supabase } from "../../db/supabase.js";
import { generateOffer } from "../shared/ai/client.js";
import { config } from "../../config.js";
import { tavily } from "@tavily/core";

function nowIso() {
  return new Date().toISOString();
}

async function ack(source, count = 1) {
  return {
    status: "ingested",
    records_ingested: count,
    source,
    processed_at_utc: nowIso(),
  };
}

export async function ingestWeather(payload) {
  const { error } = await supabase.from("context_snapshots").insert({
    snapshot_type: "weather",
    payload,
    created_at: nowIso(),
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
  return ack("weather");
}

export async function ingestEvents(payload) {
  const { error } = await supabase.from("context_snapshots").insert({
    snapshot_type: "events",
    payload,
    created_at: nowIso(),
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
  return ack("events");
}

export async function ingestPayone(payload) {
  const { error } = await supabase.from("context_snapshots").insert({
    snapshot_type: "payone",
    payload,
    created_at: nowIso(),
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
  return ack("payone_sim");
}

export async function runGeneration(payload) {
  const result = await generateOffer(payload);
  return result.output;
}

export async function scrapeMerchantProfile(payload) {
  const url = payload.google_maps_url || payload.name || "";
  let rawText = "";

  try {
    if (config.tavilyApiKey) {
      const tvly = tavily({ apiKey: config.tavilyApiKey });
      const searchRes = await tvly.search(`${url} on Google Maps`, {
        includeDomains: ["google.com"],
        searchDepth: "basic",
        maxResults: 3,
      });
      rawText = searchRes.results.map((r) => r.content).join("\n\n");
    } else {
      console.warn("No TAVILY_API_KEY found, using mock data.");
    }
  } catch (err) {
    console.error("Tavily search failed:", err);
  }

  if (!rawText) {
    return {
      merchant_id: payload.merchant_id,
      category: "Unknown",
      opening_hours: ["Mon-Sun 09:00-17:00"],
      tags: ["fallback_mock"],
      confidence: 0.1,
      status: "mocked",
    };
  }

  let extracted = {};
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openRouterApiKey}`,
        ...(config.openRouterProxySessionToken
          ? { Authorization: `Bearer ${config.openRouterProxySessionToken}` }
          : {}),
        "HTTP-Referer": "https://localhost",
        "X-Title": "Generative City Wallet",
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages: [
          {
            role: "system",
            content:
              "Extract the merchant's category, address, and business_hours from the search results. Return ONLY valid JSON matching this schema: {\"name\": \"string\", \"category\": \"string\", \"address\": \"string\", \"business_hours\": {\"Monday\": \"string\"}}",
          },
          {
            role: "user",
            content: `Search Results for ${url}:\n\n${rawText}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    const data = await res.json();
    extracted = JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error("LLM Extraction failed:", err);
    extracted = { error: "LLM extraction failed" };
  }

  const hoursObj = extracted.business_hours || {};
  const opening_hours = Object.entries(hoursObj)
    .filter(([, v]) => v && v !== "Unknown")
    .map(([day, hours]) => `${day} ${hours}`);

  if (opening_hours.length === 0) opening_hours.push("Hours not available");

  const tags = extracted.category
    ? [extracted.category.toLowerCase().replace(/\s+/g, "_")]
    : ["unknown_category"];

  return {
    merchant_id: payload.merchant_id,
    category: extracted.category || "Unknown",
    opening_hours,
    tags,
    confidence: extracted.error ? 0.2 : 0.85,
    status: "extracted",
  };
}

export async function upsertMerchant(payload) {
  const meta = {
    area_cell_id: payload.area_cell_id,
    lat: payload.lat,
    lon: payload.lon,
    is_open_now: payload.is_open_now,
    price_band: payload.price_band,
    avg_ticket_size_eur: payload.avg_ticket_size_eur,
    cuisine: payload.cuisine,
    discount_events: payload.discount_events,
    dietary_restrictions: payload.dietary_restrictions,
    hours: payload.hours,
    max_discount_value: payload.max_discount_value,
    budget: payload.budget,
    external_merchant_id: payload.merchant_id,
  };

  const { data: existing } = await supabase
    .from("merchants")
    .select("id")
    .eq("business_hours->>external_merchant_id", payload.merchant_id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("merchants")
      .update({ name: payload.name, category: payload.category, business_hours: meta })
      .eq("id", existing.id);
  } else {
    await supabase.from("merchants").insert({
      name: payload.name,
      category: payload.category,
      business_hours: meta,
      address: payload.address ?? null,
      google_maps_url: payload.google_maps_url ?? null,
    });
  }

  const { count } = await supabase.from("merchants").select("*", { count: "exact", head: true });

  return {
    merchant_id: payload.merchant_id,
    status: "upserted",
    total_merchants: count ?? 0,
  };
}

export async function listMerchants(filter) {
  let query = supabase.from("merchants").select("*");
  if (filter.merchant_id) {
    query = query.or(
      `id.eq.${filter.merchant_id},business_hours->external_merchant_id.eq."${filter.merchant_id}"`,
    );
  }
  const { data: merchants, error } = await query;
  if (error) throw new Error(`Supabase Error: ${error.message}`);

  const mapped = (merchants || []).map((m) => ({
    merchant_id: m.business_hours?.external_merchant_id ?? m.id,
    name: m.name,
    category: m.category ?? "unknown",
    cuisine: m.business_hours?.cuisine ?? "unknown",
    discount_events: Array.isArray(m.business_hours?.discount_events)
      ? m.business_hours.discount_events
      : [],
    dietary_restrictions: Array.isArray(m.business_hours?.dietary_restrictions)
      ? m.business_hours.dietary_restrictions
      : [],
    hours: Array.isArray(m.business_hours?.hours) ? m.business_hours.hours : ["Unknown"],
    max_discount_value: m.business_hours?.max_discount_value ?? 0,
    budget: m.business_hours?.budget ?? 0,
    area_cell_id: m.business_hours?.area_cell_id ?? "u0wtm0",
    lat: m.business_hours?.lat ?? 0,
    lon: m.business_hours?.lon ?? 0,
    is_open_now: m.business_hours?.is_open_now ?? true,
    price_band: m.business_hours?.price_band ?? "mid",
    avg_ticket_size_eur: m.business_hours?.avg_ticket_size_eur ?? 0,
  }));

  return { merchants: mapped };
}
