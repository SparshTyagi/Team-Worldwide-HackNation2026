import test from "node:test";
import assert from "node:assert/strict";
import { SchemaValidationError, validateSchema } from "../src/validation.js";

test("voice identity create input accepts merchant sales profile fields", () => {
  assert.doesNotThrow(() =>
    validateSchema(
      "voice_agent_identity_create_input",
      {
        brand_story: "Family cafe focused on fresh pastries and friendly service.",
        menu_highlights: ["cortado", "pistachio croissant"],
        promotions: ["happy hour 14:00-17:00"],
        voice_name: "Warm Guide",
        voice_id: "voice_abc123",
        tone: "friendly",
        language: "en",
      },
      "input",
    ),
  );
});

test("voice identity create input rejects unknown fields", () => {
  assert.throws(
    () =>
      validateSchema(
        "voice_agent_identity_create_input",
        {
          brand_story: "Hello",
          unexpected_field: true,
        },
        "input",
      ),
    (error) =>
      error instanceof SchemaValidationError &&
      error.details.some((detail) => detail.includes("unexpected_field is not allowed")),
  );
});

test("voice agent session output supports token or signed url response", () => {
  assert.doesNotThrow(() =>
    validateSchema(
      "voice_agent_session_token_output",
      {
        merchant_id: "merchant_uuid",
        agent_id: "agent_1",
        provider: "elevenlabs",
        created_at_utc: new Date().toISOString(),
        session_token: "session-token-xyz",
      },
      "output",
    ),
  );

  assert.doesNotThrow(() =>
    validateSchema(
      "voice_agent_session_token_output",
      {
        merchant_id: "merchant_uuid",
        agent_id: "agent_1",
        provider: "elevenlabs",
        created_at_utc: new Date().toISOString(),
        signed_url: "https://api.elevenlabs.io/v1/convai/conversation/signed/demo",
      },
      "output",
    ),
  );
});
