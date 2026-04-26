/**
 * context-fetcher.js — Live weather and events ingestion via Tavily + OpenRouter.
 *
 * Implements a stale-while-revalidate pattern:
 *   - Checks the age of the latest snapshot in Supabase.
 *   - If stale (older than CONTEXT_REFRESH_MAX_AGE_MINUTES), fetches fresh data
 *     from Tavily, extracts structured JSON via OpenRouter, and persists to DB.
 *   - Called automatically at the start of every offer generation request.
 *
 * Manual POST to /internal/context/ingest/weather (or /events) always wins —
 * those routes write a fresh snapshot, which will be used as-is for the next
 * MAX_AGE_MINUTES window.
 */

import { tavily } from "@tavily/core";
import { supabase } from "../db/supabase.js";
import { config } from "../config.js";

const MAX_AGE_MS = (config.contextRefreshMaxAgeMinutes ?? 30) * 60_000;
const CITY = config.contextCity ?? "Stuttgart";

// ── Staleness check ────────────────────────────────────────────────────────

async function isStale(snapshotType) {
  const { data } = await supabase
    .from("context_snapshots")
    .select("created_at")
    .eq("snapshot_type", snapshotType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return true;
  const ageMs = Date.now() - new Date(data.created_at).getTime();
  return ageMs > MAX_AGE_MS;
}

// ── Tavily search helper ───────────────────────────────────────────────────

async function tavilySearch(query, domains, maxResults = 4) {
  if (!config.tavilyApiKey) {
    console.warn("[context-fetcher] No TAVILY_API_KEY — skipping live fetch.");
    return null;
  }
  const client = tavily({ apiKey: config.tavilyApiKey });
  const result = await client.search(query, {
    includeDomains: domains,
    searchDepth: "basic",
    maxResults,
  });
  return result.results.map((r) => r.content).join("\n\n").slice(0, 3000);
}

// ── LLM extraction helper ─────────────────────────────────────────────────

async function extractJson(systemPrompt, rawText) {
  if (!config.openRouterApiKey || !rawText) return null;

  const baseUrl = config.openRouterProxyBaseUrl || "https://openrouter.ai/api/v1";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Hack-Nation-2026",
        "X-Title": "City Wallet Context Fetcher",
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: rawText },
        ],
        temperature: 0,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(content);
  } catch (err) {
    console.error("[context-fetcher] LLM extraction failed:", err.message);
    return null;
  }
}

// ── Weather ───────────────────────────────────────────────────────────────

const WEATHER_SYSTEM_PROMPT = `You extract current weather data from raw text.
Return ONLY valid JSON with these exact keys:
{
  "weather_summary": "short description e.g. Cloudy, 11°C",
  "temperature_c": <number>,
  "condition": "sunny|cloudy|rainy|stormy|snowy|foggy|unknown",
  "precipitation_mm": <number, 0 if none>
}
If you cannot determine a value, use sensible defaults (temperature_c: 15, condition: "unknown").
Do not include any text outside the JSON object.`;

async function fetchAndIngestWeather() {
  console.log(`[context-fetcher] Fetching live weather for ${CITY} via Tavily...`);

  const rawText = await tavilySearch(
    `${CITY} current weather temperature conditions right now today`,
    ["wttr.in", "weather.com", "wetter.de", "timeanddate.com", "meteogroup.com"],
    4
  );

  const fallback = {
    city: CITY,
    weather_summary: `Weather data unavailable`,
    temperature_c: 15,
    condition: "unknown",
    precipitation_mm: 0,
    source: "fallback",
    observed_at_utc: new Date().toISOString(),
  };

  let extracted = rawText
    ? await extractJson(WEATHER_SYSTEM_PROMPT, rawText)
    : null;

  const payload = {
    city: CITY,
    area_cell_id: "u0wtm3",
    observed_at_utc: new Date().toISOString(),
    source: extracted ? "tavily" : "fallback",
    ...(extracted ?? fallback),
  };

  const { error } = await supabase.from("context_snapshots").insert({
    snapshot_type: "weather",
    payload,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[context-fetcher] Failed to persist weather snapshot:", error.message);
  } else {
    console.log(`[context-fetcher] Weather ingested: ${payload.weather_summary}`);
  }
}

// ── Events ────────────────────────────────────────────────────────────────

const EVENTS_SYSTEM_PROMPT = `You extract local event data from raw text for a city.
Return ONLY valid JSON with these exact keys:
{
  "event_intensity": "low|medium|high",
  "events": [
    {
      "event_id": "evt_<short_id>",
      "title": "<event name>",
      "category": "music|sports|food|market|culture|festival|other",
      "start_utc": "<ISO timestamp or empty string>"
    }
  ]
}
Include up to 4 events. If no events found, return event_intensity "low" and an empty events array.
Do not include any text outside the JSON object.`;

async function fetchAndIngestEvents() {
  console.log(`[context-fetcher] Fetching live events for ${CITY} via Tavily...`);

  const rawText = await tavilySearch(
    `${CITY} events happening today concerts markets festivals what's on`,
    [
      "eventbrite.de",
      "eventbrite.com",
      "meetup.com",
      "stuttgart.de",
      "veranstaltungen-stuttgart.de",
      "visitstuttgart.de",
    ],
    5
  );

  const fallback = {
    city: CITY,
    event_intensity: "low",
    events: [],
    source: "fallback",
    observed_at_utc: new Date().toISOString(),
  };

  let extracted = rawText
    ? await extractJson(EVENTS_SYSTEM_PROMPT, rawText)
    : null;

  // Normalise event_ids if missing
  if (extracted?.events) {
    extracted.events = extracted.events.map((e, i) => ({
      event_id: e.event_id || `evt_live_${i}`,
      title: e.title || "Local event",
      category: e.category || "other",
      start_utc: e.start_utc || "",
      end_utc: "",
    }));
  }

  const payload = {
    city: CITY,
    area_cell_id: "u0wtm3",
    observed_at_utc: new Date().toISOString(),
    source: extracted ? "tavily" : "fallback",
    ...(extracted ?? fallback),
  };

  const { error } = await supabase.from("context_snapshots").insert({
    snapshot_type: "events",
    payload,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[context-fetcher] Failed to persist events snapshot:", error.message);
  } else {
    console.log(
      `[context-fetcher] Events ingested: intensity=${payload.event_intensity}, count=${payload.events?.length ?? 0}`
    );
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Ensures weather and event context snapshots are fresh.
 * Called automatically before offer generation.
 * Runs both checks in parallel; only re-fetches stale types.
 *
 * @param {string} [city] - City to fetch for (defaults to CONTEXT_CITY env var)
 */
export async function ensureFreshContext(city = CITY) {
  try {
    const [weatherStale, eventsStale] = await Promise.all([
      isStale("weather"),
      isStale("events"),
    ]);

    const tasks = [];
    if (weatherStale) tasks.push(fetchAndIngestWeather(city));
    if (eventsStale) tasks.push(fetchAndIngestEvents(city));

    if (tasks.length > 0) {
      await Promise.all(tasks);
    } else {
      console.log("[context-fetcher] Context snapshots are fresh — skipping Tavily fetch.");
    }
  } catch (err) {
    // Non-fatal: log the error but allow offer generation to proceed
    // with whatever snapshots are already in the DB.
    console.error("[context-fetcher] ensureFreshContext error (non-fatal):", err.message);
  }
}
