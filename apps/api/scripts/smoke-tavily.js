import { tavily } from "@tavily/core";
import { config } from "../src/config.js";

async function runQuery(client, label, query, includeDomains, maxResults) {
  const result = await client.search(query, {
    topic: "general",
    searchDepth: "basic",
    maxResults,
    includeDomains,
    includeAnswer: false,
  });

  return {
    label,
    query,
    results_count: Array.isArray(result?.results) ? result.results.length : 0,
    first_title: result?.results?.[0]?.title || null,
    first_url: result?.results?.[0]?.url || null,
  };
}

async function main() {
  if (!config.tavilyApiKey) {
    throw new Error("Missing TAVILY_API_KEY. Add it to apps/api/.env or root .env.local.");
  }

  const client = tavily({ apiKey: config.tavilyApiKey });

  const checks = await Promise.all([
    runQuery(
      client,
      "weather",
      "Stuttgart current weather temperature conditions right now",
      ["wttr.in", "weather.com", "wetter.de", "timeanddate.com", "meteogroup.com"],
      4
    ),
    runQuery(
      client,
      "events",
      "Stuttgart events happening today concerts markets festivals",
      ["eventbrite.com", "eventbrite.de", "meetup.com", "stuttgart.de", "visitstuttgart.de"],
      5
    ),
    runQuery(client, "merchant_profile", "Tony's Cafe Stuttgart Google Maps", ["google.com"], 3),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        city: config.contextCity,
        search_depth: "basic",
        checks,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Tavily smoke check failed:", error.message);
  process.exit(1);
});
