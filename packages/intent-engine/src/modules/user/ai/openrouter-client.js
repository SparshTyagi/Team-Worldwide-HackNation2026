const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_PROXY_PATH = "/v1/offer/openrouter";

/**
 * OpenRouter chat completion caller.
 * Production usage should route through backend proxy with session auth.
 */
async function callOpenRouter({
  apiKey,
  proxyBaseUrl,
  sessionToken,
  allowInsecureBrowserKey = false,
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.4,
  maxTokens = 500,
  timeoutMs = 9000,
  referer = process.env.OPENROUTER_HTTP_REFERER || "https://localhost",
  appTitle = process.env.OPENROUTER_APP_TITLE || "Generative City Wallet",
}) {
  if (!model) {
    throw new Error("Missing OpenRouter model");
  }

  const isBrowser = typeof window !== "undefined";
  const useProxy = Boolean(proxyBaseUrl);

  if (isBrowser && !useProxy && !allowInsecureBrowserKey) {
    throw new Error(
      "Unsafe browser OpenRouter call blocked. Use proxyBaseUrl + sessionToken.",
    );
  }

  if (!useProxy && !apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  const requestBody = JSON.stringify({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const requestUrl = useProxy ? `${proxyBaseUrl}${OPENROUTER_PROXY_PATH}` : OPENROUTER_URL;
  const headers = {
    "Content-Type": "application/json",
    "HTTP-Referer": referer,
    "X-Title": appTitle,
  };
  if (useProxy) {
    if (!sessionToken) {
      throw new Error("Missing proxy session token");
    }
    headers.Authorization = `Bearer ${sessionToken}`;
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(requestUrl, {
    method: "POST",
    headers,
    body: requestBody,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutHandle));

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

module.exports = { callOpenRouter };
