const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Browser-safe wrapper for OpenRouter chat completions.
 * Note: for production, proxy this server-side so API keys stay private.
 */
async function callOpenRouter({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.4,
  maxTokens = 500,
  timeoutMs = 9000,
}) {
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }
  if (!model) {
    throw new Error("Missing OpenRouter model");
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://localhost",
      "X-Title": "Generative City Wallet",
    },
    body: JSON.stringify({
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
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutHandle));

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

module.exports = { callOpenRouter };
