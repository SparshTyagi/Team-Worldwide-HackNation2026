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

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function withTimeout(promiseFactory, timeoutMs = 4000, label = "operation") {
  let timeoutId;
  try {
    return await Promise.race([
      promiseFactory(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function guessCategoryFromName(name) {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("bakery") || normalized.includes("bake")) return "Bakery";
  if (normalized.includes("cafe") || normalized.includes("coffee")) return "Cafe";
  if (normalized.includes("pizza") || normalized.includes("restaurant") || normalized.includes("ristorante")) {
    return "Restaurant";
  }
  return "Unknown";
}

function normalizeMapsCategory(category, fallbackName = "") {
  const raw = String(category || "").trim();
  if (!raw || /^unknown$/i.test(raw)) return guessCategoryFromName(fallbackName);
  return raw;
}

function cleanMapsText(value) {
  return String(value || "")
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/[•●]+/g, "·")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFromJinaMapsMarkdown(markdown) {
  const text = String(markdown || "");
  const pick = (pattern) => cleanMapsText(text.match(pattern)?.[1] || "");

  const name = pick(/^#\s*(.+?)\s*-\s*Google Maps/im);
  const categoryRaw = pick(/(?:\n|^)([A-Za-z][A-Za-z &/-]{2,})·/m);
  const category = normalizeMapsCategory(categoryRaw, name);
  const address =
    pick(/(?:\n|^)([^@\n]*,\s*\d{4,6}\s+[^,\n]+,\s*[A-Za-z][^\n]+)(?:\n|$)/m) ||
    pick(/(?:\n|^)([^@\n]*,\s*[A-Za-z][^\n]+,\s*[A-Za-z][^\n]+)(?:\n|$)/m);
  const phone = pick(/(\+\d[\d\s()\-]{6,}\d)/m);
  const openNow = pick(/(?:\n|^)(Open\s*·\s*[^\n]+)(?:\n|$)/m);
  const todayHours = pick(
    /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\*?\s+([0-9][^\n]*)/m,
  );
  const openingHours = [openNow, todayHours].filter(Boolean);

  return {
    name: name || "",
    category,
    address: address || "",
    phone: phone || "",
    opening_hours: openingHours,
    snippet: [name, category, address, phone, ...openingHours].filter(Boolean).join("\n"),
  };
}

function extractPlaceNameFromMapsUrl(url) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/maps\/place\/([^/]+)/i);
    if (!match?.[1]) return "";
    return decodeURIComponent(match[1].replace(/\+/g, " ")).trim();
  } catch {
    return "";
  }
}

function extractFromMapsHtml(html, resolvedUrl = "") {
  const extract = (pattern) => {
    const match = html.match(pattern);
    return match?.[1] ? decodeHtmlEntities(match[1].trim()) : "";
  };

  const nameFromUrl = extractPlaceNameFromMapsUrl(resolvedUrl);
  const htmlName =
    extract(/<meta property="og:title" content="([^"]+)"/i) ||
    extract(/<title>([^<]+)<\/title>/i);
  const name =
    htmlName && htmlName.toLowerCase() !== "google maps" ? htmlName : nameFromUrl || "Unknown business";

  const description = extract(/<meta property="og:description" content="([^"]+)"/i);
  const address =
    extract(/"formattedAddress":"([^"]+)"/i) ||
    extract(/"address":"([^"]+)"/i) ||
    (description.includes("·") ? description.split("·")[0].trim() : "") ||
    "Address unavailable";

  const phone =
    extract(/"phone":"([^"]+)"/i) ||
    extract(/"internationalPhoneNumber":"([^"]+)"/i) ||
    (description.match(/(?:\+?\d[\d()\-\s]{7,}\d)/)?.[0] ?? "Phone unavailable");

  return { name, address, phone, description };
}

export async function scrapeMerchantProfile(payload) {
  const url = payload.google_maps_url || payload.name || "";
  let rawText = "";
  let mapsExtraction = null;
  let jinaExtraction = null;
  const fallbackCategory = guessCategoryFromName(url);

  if (url) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SpotWorld/1.0; +https://spotworld.app)",
          },
        },
        6000,
      );
      if (response.ok) {
        const html = await response.text();
        mapsExtraction = extractFromMapsHtml(html, response.url);
        rawText = `${mapsExtraction.name}\n${mapsExtraction.address}\n${mapsExtraction.phone}\n${mapsExtraction.description || ""}`;
      }
    } catch (err) {
      console.warn("Direct maps fetch failed:", err instanceof Error ? err.message : err);
    }
  }

  if (url) {
    try {
      const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const jinaUrl = `https://r.jina.ai/http://${normalizedUrl.replace(/^https?:\/\//i, "")}`;
      const response = await fetchWithTimeout(jinaUrl, {}, 5500);
      if (response.ok) {
        const markdown = await response.text();
        jinaExtraction = extractFromJinaMapsMarkdown(markdown);
        if (jinaExtraction.snippet) {
          rawText = [rawText, jinaExtraction.snippet].filter(Boolean).join("\n\n");
        }
      }
    } catch (err) {
      console.warn("Jina maps extraction failed:", err instanceof Error ? err.message : err);
    }
  }

  try {
    if (config.tavilyApiKey) {
      const tvly = tavily({ apiKey: config.tavilyApiKey });
      const searchRes = await withTimeout(
        () =>
          tvly.search(`${url} on Google Maps`, {
            includeDomains: ["google.com"],
            searchDepth: "basic",
            maxResults: 3,
          }),
        4000,
        "tavily_search",
      );
      const tavilyText = searchRes.results.map((r) => r.content).join("\n\n");
      rawText = [rawText, tavilyText].filter(Boolean).join("\n\n");
    } else {
      console.warn("No TAVILY_API_KEY found, using mock data.");
    }
  } catch (err) {
    console.error("Tavily search failed:", err);
  }

  if (!rawText) {
    const resolvedCategory = normalizeMapsCategory(
      jinaExtraction?.category || mapsExtraction?.category || "",
      mapsExtraction?.name || url,
    );
    const resolvedHours =
      (Array.isArray(jinaExtraction?.opening_hours) && jinaExtraction.opening_hours.length
        ? jinaExtraction.opening_hours
        : null) || ["Mon-Sun 09:00-17:00"];
    return {
      merchant_id: payload.merchant_id,
      name: jinaExtraction?.name || mapsExtraction?.name || "Unknown business",
      category: resolvedCategory || fallbackCategory,
      address: jinaExtraction?.address || mapsExtraction?.address || "Address unavailable",
      phone: jinaExtraction?.phone || mapsExtraction?.phone || "Phone unavailable",
      opening_hours: resolvedHours,
      tags: ["fallback_mock"],
      avg_ticket_size_eur: 12,
      confidence: 0.1,
      status: "mocked",
    };
  }

  let extracted = {};
  try {
    const authToken = config.openRouterProxySessionToken || config.openRouterApiKey;
    if (!authToken) {
      throw new Error("Missing OpenRouter credentials for merchant profile extraction.");
    }
    const res = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
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
      },
      5000,
    );
    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}`);
    }
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

  if (opening_hours.length === 0) {
    const fallbackHours =
      (Array.isArray(jinaExtraction?.opening_hours) && jinaExtraction.opening_hours.length
        ? jinaExtraction.opening_hours
        : null) || ["Hours not available"];
    opening_hours.push(...fallbackHours);
  }

  const tags = extracted.category
    ? [extracted.category.toLowerCase().replace(/\s+/g, "_")]
    : ["unknown_category"];

  const phoneMatch = rawText.match(
    /(?:\+?\d[\d()\-\s]{7,}\d)/,
  );
  const avgTicketByCategory = {
    cafe: 8,
    bakery: 7,
    restaurant: 18,
    fast_food: 10,
    unknown: 12,
  };
  const resolvedCategory = normalizeMapsCategory(
    extracted.category || jinaExtraction?.category || "",
    mapsExtraction?.name || jinaExtraction?.name || url,
  );
  const normalizedCategory = String(resolvedCategory || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const avgTicketSize =
    avgTicketByCategory[normalizedCategory] ??
    avgTicketByCategory[normalizedCategory.split("_")[0]] ??
    avgTicketByCategory.unknown;

  return {
    merchant_id: payload.merchant_id,
    name: extracted.name || jinaExtraction?.name || mapsExtraction?.name || "Unknown business",
    category: resolvedCategory,
    address:
      extracted.address || jinaExtraction?.address || mapsExtraction?.address || "Address unavailable",
    phone: phoneMatch?.[0] || jinaExtraction?.phone || mapsExtraction?.phone || "Phone unavailable",
    opening_hours,
    tags,
    avg_ticket_size_eur: avgTicketSize,
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

export async function setMerchantApproval(payload) {
  let { data: existing, error: fetchError } = await supabase
    .from("merchants")
    .select("id, business_hours")
    .eq("id", payload.merchant_id)
    .maybeSingle();

  if (fetchError) throw new Error(`Supabase Error: ${fetchError.message}`);

  if (!existing) {
    const byExternal = await supabase
      .from("merchants")
      .select("id, business_hours")
      .eq("business_hours->>external_merchant_id", payload.merchant_id)
      .maybeSingle();
    existing = byExternal.data;
    fetchError = byExternal.error;
  }

  if (fetchError) throw new Error(`Supabase Error: ${fetchError.message}`);
  if (!existing) throw new Error(`Merchant not found: ${payload.merchant_id}`);

  const businessHours = existing.business_hours || {};
  if (payload.decision === "approved" && businessHours.challenge_target_fit === false) {
    throw new Error(
      "Merchant category is outside the challenge target business types. Update category before approval.",
    );
  }
  const updatedMeta = {
    ...businessHours,
    approval_status: payload.decision,
    approval_notes: payload.notes || null,
    approval_updated_at: nowIso(),
    approved_by: payload.reviewed_by || "challenge_admin",
  };

  const { error: updateError } = await supabase
    .from("merchants")
    .update({ business_hours: updatedMeta })
    .eq("id", existing.id);

  if (updateError) throw new Error(`Supabase Error: ${updateError.message}`);

  return {
    merchant_id: payload.merchant_id,
    approval_status: payload.decision,
    approved_by: payload.reviewed_by || "challenge_admin",
    updated_at_utc: nowIso(),
  };
}

export async function listMerchants(filter) {
  let query = supabase.from("merchants").select("*");
  if (filter.merchant_id) {
    query = query.or(`id.eq.${filter.merchant_id},business_hours->>external_merchant_id.eq.${filter.merchant_id}`);
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
    approval_status: m.business_hours?.approval_status ?? "approved",
    approval_notes: m.business_hours?.approval_notes ?? null,
    challenge_target_fit: m.business_hours?.challenge_target_fit ?? null,
  }));

  return { merchants: mapped };
}
