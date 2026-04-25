"use strict";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  const msg = String(error && error.message ? error.message : "");
  return (
    msg.includes("timeout") ||
    msg.includes("429") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("network") ||
    msg.includes("aborted")
  );
}

async function withRetry(task, { maxAttempts = 3, baseDelayMs = 250 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isRetryableError(error)) break;
      const jitter = Math.floor(Math.random() * 100);
      const backoffMs = baseDelayMs * 2 ** (attempt - 1);
      await sleep(backoffMs + jitter);
    }
  }
  throw lastError;
}

module.exports = { withRetry };
