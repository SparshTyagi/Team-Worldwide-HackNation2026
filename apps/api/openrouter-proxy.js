import http from "node:http";
import { URL } from "node:url";
import { fileURLToPath } from "node:url";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function getBearerToken(req) {
  const auth = String(req.headers.authorization || "");
  if (!auth.startsWith("Bearer ")) return "";
  return auth.slice("Bearer ".length).trim();
}

function validateSession(req, expectedSessionToken) {
  if (!expectedSessionToken) return true;
  const presented = getBearerToken(req);
  return presented && presented === expectedSessionToken;
}

async function handleOpenRouterProxy(req, res, config) {
  if (!config.openRouterApiKey) {
    sendJson(res, 500, { error: "Server missing OPENROUTER_API_KEY" });
    return;
  }
  if (!validateSession(req, config.expectedSessionToken)) {
    sendJson(res, 401, { error: "Unauthorized session token" });
    return;
  }

  let parsedBody;
  try {
    const raw = await readBody(req);
    parsedBody = JSON.parse(raw || "{}");
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  try {
    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": config.httpReferer,
        "X-Title": config.appTitle,
      },
      body: JSON.stringify(parsedBody),
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";
    res.writeHead(upstream.status, { "Content-Type": contentType });
    res.end(text);
  } catch {
    sendJson(res, 502, { error: "Upstream OpenRouter request failed" });
  }
}

export function createProxyServer({
  openRouterApiKey = process.env.OPENROUTER_API_KEY,
  expectedSessionToken = process.env.OPENROUTER_PROXY_SESSION_TOKEN,
  httpReferer = process.env.OPENROUTER_HTTP_REFERER || "https://localhost",
  appTitle = process.env.OPENROUTER_APP_TITLE || "Generative City Wallet",
} = {}) {
  const config = {
    openRouterApiKey,
    expectedSessionToken,
    httpReferer,
    appTitle,
  };

  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "POST" && url.pathname === "/v1/offer/openrouter") {
      await handleOpenRouterProxy(req, res, config);
      return;
    }
    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }
    sendJson(res, 404, { error: "Not found" });
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const port = Number(process.env.OPENROUTER_PROXY_PORT || 8787);
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("Warning: OPENROUTER_API_KEY is missing. Proxy requests will fail.");
  }
  if (!process.env.OPENROUTER_PROXY_SESSION_TOKEN) {
    console.warn("Warning: OPENROUTER_PROXY_SESSION_TOKEN is not set. Proxy will accept unsigned sessions.");
  }
  const server = createProxyServer();
  server.listen(port, () => {
    console.log(`OpenRouter proxy listening on http://localhost:${port}`);
  });
}
