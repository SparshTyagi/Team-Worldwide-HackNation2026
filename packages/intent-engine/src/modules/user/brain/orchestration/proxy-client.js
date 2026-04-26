"use strict";

async function callOfferProxy({
  baseUrl,
  authToken,
  body,
  timeoutMs = 9000,
  signal,
}) {
  if (!baseUrl) throw new Error("Missing proxy baseUrl");

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  const abortHandler = () => controller.abort();
  if (signal) signal.addEventListener("abort", abortHandler);

  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${baseUrl}/v1/offer/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Proxy call failed (${response.status}): ${text}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutHandle);
    if (signal) signal.removeEventListener("abort", abortHandler);
  }
}

module.exports = { callOfferProxy };
