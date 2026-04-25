import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createProxyServer } from "../openrouter-proxy.js";

async function startServer(server) {
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

function postJson(baseUrl, path, payload, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(path, baseUrl);
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const req = http.request(
      {
        method: "POST",
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({ statusCode: res.statusCode, body: JSON.parse(text) });
        });
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

test("proxy rejects missing session token with 401 and skips upstream call", async () => {
  const originalFetch = global.fetch;
  let upstreamCalled = false;
  global.fetch = async () => {
    upstreamCalled = true;
    return {
      ok: true,
      text: async () => "{}",
      headers: new Map([["content-type", "application/json"]]),
      status: 200,
    };
  };

  const server = createProxyServer({
    openRouterApiKey: "test_key",
    expectedSessionToken: "expected_token",
  });

  try {
    const baseUrl = await startServer(server);
    const response = await postJson(baseUrl, "/v1/offer/openrouter", {
      model: "m",
      messages: [],
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.error, "Unauthorized session token");
    assert.equal(upstreamCalled, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    global.fetch = originalFetch;
  }
});

test("proxy forwards request with valid session token", async () => {
  const originalFetch = global.fetch;
  let upstreamCalled = false;
  global.fetch = async (_url, options = {}) => {
    upstreamCalled = true;
    const parsed = JSON.parse(String(options.body || "{}"));
    assert.equal(parsed.model, "nvidia/nemotron-3-super:free");
    return {
      status: 200,
      headers: {
        get(name) {
          return name.toLowerCase() === "content-type" ? "application/json" : null;
        },
      },
      text: async () => JSON.stringify({ id: "chatcmpl_1", choices: [] }),
    };
  };

  const server = createProxyServer({
    openRouterApiKey: "test_key",
    expectedSessionToken: "expected_token",
  });

  try {
    const baseUrl = await startServer(server);
    const response = await postJson(
      baseUrl,
      "/v1/offer/openrouter",
      {
        model: "nvidia/nemotron-3-super:free",
        messages: [{ role: "user", content: "hello" }],
      },
      "expected_token",
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.id, "chatcmpl_1");
    assert.equal(upstreamCalled, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    global.fetch = originalFetch;
  }
});
