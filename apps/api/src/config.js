import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load .env files without extra deps. Does not override existing process.env.
 *
 * Priority:
 * 1) apps/api/.env (canonical backend runtime env)
 * 2) repo-root .env.local (developer-local overrides)
 * 3) repo-root .env (backward-compat fallback)
 */
function applyEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function loadLocalEnv() {
  const envPaths = [
    join(__dirname, "..", ".env"),
    join(__dirname, "..", "..", "..", ".env.local"),
    join(__dirname, "..", "..", "..", ".env"),
  ];
  envPaths.forEach(applyEnvFile);
}

loadLocalEnv();

export const config = {
  port: Number(process.env.PORT || 8080),
  host: process.env.HOST || "0.0.0.0",
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterProxyBaseUrl: process.env.OPENROUTER_PROXY_BASE_URL,
  openRouterProxySessionToken: process.env.OPENROUTER_PROXY_SESSION_TOKEN,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  tavilyApiKey: process.env.TAVILY_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID,
  elevenLabsBaseUrl: (process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io/v1").replace(
    /\/+$/,
    ""
  ),
  llmModel:
    process.env.OPENROUTER_SERVER_LARGE_MODEL ||
    process.env.OPENROUTER_OFFER_MODEL ||
    process.env.OPENROUTEROFFERMODEL ||
    process.env.OPENROUTER_MODEL ||
    "nvidia/nemotron-3-super-120b-a12b:free",
  defaults: {
    radiusKm: 2,
    offerTtlMinutes: 15,
  },
  // Live context ingestion settings
  contextRefreshMaxAgeMinutes: Number(process.env.CONTEXT_REFRESH_MAX_AGE_MINUTES ?? 30),
  contextCity: process.env.CONTEXT_CITY ?? "Stuttgart",
};
