import { db } from "../data.js";
import { generateOffer } from "../llm/client.js";

function ack(source, count = 1) {
  return {
    status: "ingested",
    records_ingested: count,
    source,
    processed_at_utc: new Date().toISOString(),
  };
}

export function ingestWeather(payload) {
  db.context.weather.push(payload);
  return ack("weather");
}

export function ingestEvents(payload) {
  db.context.events.push(payload);
  return ack("events");
}

export function ingestPayone(payload) {
  db.context.payone.push(payload);
  return ack("payone_sim");
}

export async function runGeneration(payload) {
  const result = await generateOffer(payload);
  return result.output;
}

export function scrapeMerchantProfile(payload) {
  const url = payload.google_maps_url || "";
  return {
    merchant_id: payload.merchant_id,
    category: "cafe",
    opening_hours: ["Mon-Fri 08:00-18:00"],
    tags: ["espresso_bar", "vegan_options"],
    confidence: url.includes("maps") ? 0.78 : 0.52,
    status: "needs_merchant_confirmation",
  };
}

export function upsertMerchant(payload) {
  const idx = db.merchants.findIndex((m) => m.merchant_id === payload.merchant_id);
  const row = { ...payload };
  if (idx >= 0) {
    db.merchants[idx] = row;
  } else {
    db.merchants.push(row);
  }
  return {
    merchant_id: payload.merchant_id,
    status: "upserted",
    total_merchants: db.merchants.length,
  };
}

export function listMerchants(filter) {
  let rows = db.merchants;
  if (filter.merchant_id) {
    rows = rows.filter((m) => m.merchant_id === filter.merchant_id);
  }
  return { merchants: rows };
}
