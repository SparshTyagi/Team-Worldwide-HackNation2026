"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { callOfferProxy } = require("../orchestration/proxy-client.js");

test("proxy client returns parsed payload for successful response", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ offer: { headline: "ok" } }),
  });

  try {
    const response = await callOfferProxy({
      baseUrl: "https://proxy.example.com",
      authToken: "token",
      body: { intent_packet: {} },
    });
    assert.equal(response.offer.headline, "ok");
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy client throws status details for failed response", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 502,
    text: async () => "bad gateway",
  });

  try {
    await assert.rejects(
      () =>
        callOfferProxy({
          baseUrl: "https://proxy.example.com",
          authToken: "token",
          body: { intent_packet: {} },
        }),
      /Proxy call failed \(502\): bad gateway/,
    );
  } finally {
    global.fetch = originalFetch;
  }
});
