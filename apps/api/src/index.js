import http from "http";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { sendJson, readJsonBody } from "./utils/json.js";
import { SchemaValidationError, validateSchema } from "./validation.js";
import {
  ingestIntent,
  listActiveOffers,
  generateOfferForIntent,
  recordDecision,
  createRedemptionToken,
  validateRedemption,
  getCashback,
  getSavingsSummary,
} from "./modules/user/service.js";
import {
  createRules,
  patchRules,
  dashboardOverview,
  dashboardFunnel,
  dashboardContextPerformance,
} from "./modules/merchant/service.js";
import {
  createVoiceIdentity,
  updateVoiceIdentity,
  getVoiceIdentity,
  createVoiceSessionToken,
} from "./modules/merchant/voice-agent-service.js";
import {
  ingestWeather,
  ingestEvents,
  ingestPayone,
  runGeneration,
  scrapeMerchantProfile,
  upsertMerchant,
  setMerchantApproval,
  listMerchants,
} from "./services/internal-service.js";
import { register, login, logout } from "./services/auth-service.js";
import { extractCaller, requireAuth, requireRole, requireMerchantApproval } from "./middleware/auth.js";

const EDGE_LOCAL_INTENT_PROVIDERS = new Set(["onnx", "edge", "embedded", "ollama", "local"]);

function resolveIntentRuntimeSummary(env = process.env) {
  const provider = String(env.INTENT_MODEL_PROVIDER || "").trim().toLowerCase() || "auto";
  const intentMode = EDGE_LOCAL_INTENT_PROVIDERS.has(provider) ? "edge_local_only" : "remote_allowed";
  let intentModel = "";

  if (provider === "onnx" || provider === "edge" || provider === "embedded") {
    intentModel = env.INTENT_ONNX_MODEL_PATH || "models/intent/intent_classifier.onnx";
  } else if (provider === "ollama" || provider === "local") {
    intentModel = env.OLLAMA_INTENT_MODEL || "nemotron-3-nano:4b";
  } else {
    intentModel =
      env.OPENROUTER_INTENT_MODEL ||
      env.OPENROUTER_INTENT_SMALL_MODEL ||
      env.OLLAMA_INTENT_MODEL ||
      env.INTENT_ONNX_MODEL_PATH ||
      "nvidia/nemotron-3-nano-4b";
  }

  return {
    intent_provider: provider,
    intent_model: intentModel,
    intent_mode: intentMode,
  };
}

function notFound(res) {
  sendJson(res, 404, { error: "not_found" });
}

function badRequest(res, message) {
  sendJson(res, 400, { error: "bad_request", message });
}

function requireValidInput(schemaName, payload) {
  validateSchema(schemaName, payload, "input");
  return payload;
}

function sendValidatedOutput(res, schemaName, payload, statusCode = 200) {
  validateSchema(schemaName, payload, "output");
  return sendJson(res, statusCode, payload);
}

function applyCorsHeaders(req, res) {
  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Internal-Api-Key");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function requireInternalAccess(req, res) {
  const configuredKey = config.internalApiKey;
  const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";

  if (!configuredKey) {
    if (isProduction) {
      sendJson(res, 503, {
        error: "internal_api_disabled",
        message: "Internal routes are disabled in production unless INTERNAL_API_KEY is configured.",
      });
      return false;
    }
    return true;
  }

  const headerValue = req.headers["x-internal-api-key"];
  const providedKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!providedKey || providedKey !== configuredKey) {
    sendJson(res, 403, {
      error: "forbidden",
      message: "Missing or invalid X-Internal-Api-Key header.",
    });
    return false;
  }
  return true;
}

function resolveMerchantScope(caller, searchParams, res) {
  if (!caller?.merchantId) {
    sendJson(res, 400, { error: "bad_request", message: "No merchant account linked to this user." });
    return null;
  }

  const requestedMerchantId = searchParams.get("merchant_id");
  if (requestedMerchantId && requestedMerchantId !== caller.merchantId) {
    sendJson(res, 403, {
      error: "forbidden",
      message: "merchant_id override is not allowed for this user.",
    });
    return null;
  }

  return caller.merchantId;
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    try {
      applyCorsHeaders(req, res);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const { pathname, searchParams } = url;

      if (pathname.startsWith("/internal/")) {
        const allowed = requireInternalAccess(req, res);
        if (!allowed) return;
      }

      if (req.method === "GET" && pathname === "/health") {
        const intentRuntime = resolveIntentRuntimeSummary();
        return sendValidatedOutput(res, "health_output", {
          ok: true,
          llm_model: config.llmModel ?? undefined,
          ...intentRuntime,
        });
      }

    // ── Auth Routes (public — no JWT required) ─────────────────────────────
    if (req.method === "POST" && pathname === "/auth/register") {
      const body = await readJsonBody(req);
      if (!body.email || !body.password || !body.role) {
        return sendJson(res, 400, { error: "bad_request", message: "email, password, and role are required." });
      }
      const result = await register(body);
      return sendJson(res, 201, result);
    }

    if (req.method === "POST" && pathname === "/auth/login") {
      const body = await readJsonBody(req);
      if (!body.email || !body.password) {
        return sendJson(res, 400, { error: "bad_request", message: "email and password are required." });
      }
      const result = await login(body);
      return sendJson(res, 200, result);
    }

    if (req.method === "POST" && pathname === "/auth/logout") {
      const result = await logout();
      return sendJson(res, 200, result);
    }

    // ── Consumer Routes ───────────────────────────────────────────────────
    if (req.method === "POST" && pathname === "/v1/intent-signal") {
      const caller = await extractCaller(req);
      const body = requireValidInput("intent_signal_input", await readJsonBody(req));
      if (caller) body.auth_user_id = caller.userId;
      return sendValidatedOutput(res, "intent_signal_output", await ingestIntent(body));
    }

    if (req.method === "GET" && pathname === "/v1/offers/active") {
      const caller = await extractCaller(req);
      const locality = searchParams.get("locality") ? JSON.parse(searchParams.get("locality")) : undefined;
      const query = requireValidInput("get_active_offers_input", {
        user_pseudonym: searchParams.get("user_pseudonym"),
        channel: searchParams.get("channel") || "in_app",
        locality,
      });
      if (caller) query.auth_user_id = caller.userId;
      return sendValidatedOutput(res, "get_active_offers_output", await listActiveOffers(query));
    }

    if (req.method === "POST" && pathname === "/v1/offer/generate") {
      const body = requireValidInput("offer_generate_input", await readJsonBody(req));
      const out = await generateOfferForIntent({
        intentPacket: body.intent_packet,
        channel: body.channel || "in_app",
        locality: body.locality,
      });
      return sendValidatedOutput(
        res,
        "offer_generate_output",
        {
          offer: out.offer,
          model_version: body.model || out.model_version,
          prompt_version: body.prompt_version || out.prompt_version,
          used_fallback: out.used_fallback,
        },
        200
      );
    }

    if (req.method === "POST" && pathname.startsWith("/v1/offers/") && pathname.endsWith("/decision")) {
      const offerId = pathname.split("/")[3];
      const body = requireValidInput("offer_decision_input", {
        ...(await readJsonBody(req)),
        offer_id: offerId,
      });
      const out = await recordDecision(body);
      if (out.error) return badRequest(res, out.error);
      return sendValidatedOutput(res, "offer_decision_output", out);
    }

    if (req.method === "POST" && pathname === "/v1/redemption/create-token") {
      const body = requireValidInput("redemption_create_token_input", await readJsonBody(req));
      return sendValidatedOutput(
        res,
        "redemption_create_token_output",
        await createRedemptionToken(body)
      );
    }

    if (req.method === "POST" && pathname === "/v1/redemption/validate") {
      const body = requireValidInput("redemption_validate_input", await readJsonBody(req));
      const out = await validateRedemption(body);
      if (out.error) return badRequest(res, out.error);
      return sendValidatedOutput(res, "redemption_validate_output", out);
    }

    if (req.method === "GET" && pathname === "/v1/wallet/cashback") {
      const caller = await extractCaller(req);
      const input = requireValidInput("wallet_cashback_input", {
        user_pseudonym: searchParams.get("user_pseudonym"),
      });
      return sendValidatedOutput(res, "wallet_cashback_output", await getCashback(input.user_pseudonym, caller?.userId));
    }

    if (req.method === "GET" && pathname === "/v1/wallet/savings") {
      const caller = await extractCaller(req);
      const input = requireValidInput("wallet_cashback_input", {
        user_pseudonym: searchParams.get("user_pseudonym") || caller?.pseudonym,
      });
      return sendValidatedOutput(res, "wallet_savings_output", await getSavingsSummary(input.user_pseudonym));
    }

    // ── Merchant Routes (require merchant role JWT) ───────────────────────
    if (req.method === "POST" && pathname === "/v1/merchant/rules") {
      const caller = await requireAuth(req, res);
      if (!caller) return;
      if (!requireRole(caller, "merchant", res)) return;
      if (!requireMerchantApproval(caller, res)) return;
      const body = requireValidInput("merchant_rules_create_input", await readJsonBody(req));
      return sendValidatedOutput(res, "merchant_rules_create_output", await createRules(body));
    }

    if (req.method === "PATCH" && pathname.startsWith("/v1/merchant/rules/")) {
      const caller = await requireAuth(req, res);
      if (!caller) return;
      if (!requireRole(caller, "merchant", res)) return;
      if (!requireMerchantApproval(caller, res)) return;
      const merchantRuleId = pathname.split("/").at(-1);
      const body = requireValidInput("merchant_rules_patch_input", {
        ...(await readJsonBody(req)),
        merchant_rule_id: merchantRuleId,
      });
      return sendValidatedOutput(
        res,
        "merchant_rules_patch_output",
        await patchRules(body.merchant_id, body)
      );
    }

    if (req.method === "GET" && pathname === "/v1/merchant/dashboard/overview") {
      const caller = await requireAuth(req, res);
      if (!caller) return;
      if (!requireRole(caller, "merchant", res)) return;
      if (!requireMerchantApproval(caller, res)) return;
      const merchantId = resolveMerchantScope(caller, searchParams, res);
      if (!merchantId) return;
      const input = requireValidInput("merchant_dashboard_input", { merchant_id: merchantId });
      return sendValidatedOutput(
        res,
        "merchant_dashboard_overview_output",
        await dashboardOverview(input.merchant_id)
      );
    }

    if (req.method === "GET" && pathname === "/v1/merchant/dashboard/funnel") {
      const caller = await requireAuth(req, res);
      if (!caller) return;
      if (!requireRole(caller, "merchant", res)) return;
      if (!requireMerchantApproval(caller, res)) return;
      const merchantId = resolveMerchantScope(caller, searchParams, res);
      if (!merchantId) return;
      const input = requireValidInput("merchant_dashboard_input", { merchant_id: merchantId });
      return sendValidatedOutput(
        res,
        "merchant_dashboard_funnel_output",
        await dashboardFunnel(input.merchant_id)
      );
    }

    if (req.method === "GET" && pathname === "/v1/merchant/dashboard/context-performance") {
      const caller = await requireAuth(req, res);
      if (!caller) return;
      if (!requireRole(caller, "merchant", res)) return;
      if (!requireMerchantApproval(caller, res)) return;
      const merchantId = resolveMerchantScope(caller, searchParams, res);
      if (!merchantId) return;
      const input = requireValidInput("merchant_dashboard_input", { merchant_id: merchantId });
      return sendValidatedOutput(
        res,
        "merchant_dashboard_context_performance_output",
        await dashboardContextPerformance(input.merchant_id)
      );
    }

    if (req.method === "POST" && pathname === "/v1/merchant/voice-agent/identity") {
      const caller = await requireAuth(req, res);
      if (!caller) return;
      if (!requireRole(caller, "merchant", res)) return;
      if (!requireMerchantApproval(caller, res)) return;
      const body = requireValidInput("voice_agent_identity_create_input", await readJsonBody(req));
      if (!caller.merchantId) return badRequest(res, "No merchant account linked to this user.");
      return sendValidatedOutput(
        res,
        "voice_agent_identity_output",
        await createVoiceIdentity(caller.merchantId, body)
      );
    }

    if (req.method === "PATCH" && pathname === "/v1/merchant/voice-agent/identity") {
      const caller = await requireAuth(req, res);
      if (!caller) return;
      if (!requireRole(caller, "merchant", res)) return;
      if (!requireMerchantApproval(caller, res)) return;
      const body = requireValidInput("voice_agent_identity_patch_input", await readJsonBody(req));
      if (!caller.merchantId) return badRequest(res, "No merchant account linked to this user.");
      return sendValidatedOutput(
        res,
        "voice_agent_identity_output",
        await updateVoiceIdentity(caller.merchantId, body)
      );
    }

    if (req.method === "GET" && pathname === "/v1/merchant/voice-agent/identity") {
      const caller = await requireAuth(req, res);
      if (!caller) return;
      if (!requireRole(caller, "merchant", res)) return;
      if (!requireMerchantApproval(caller, res)) return;
      if (!caller.merchantId) return badRequest(res, "No merchant account linked to this user.");
      return sendValidatedOutput(
        res,
        "voice_agent_identity_output",
        await getVoiceIdentity(caller.merchantId)
      );
    }

    if (req.method === "POST" && pathname === "/v1/merchant/voice-agent/session-token") {
      const caller = await requireAuth(req, res);
      if (!caller) return;
      if (!requireRole(caller, "merchant", res)) return;
      if (!requireMerchantApproval(caller, res)) return;
      requireValidInput("voice_agent_session_token_input", await readJsonBody(req));
      if (!caller.merchantId) return badRequest(res, "No merchant account linked to this user.");
      return sendValidatedOutput(
        res,
        "voice_agent_session_token_output",
        await createVoiceSessionToken(caller.merchantId)
      );
    }

    if (req.method === "POST" && pathname === "/internal/context/ingest/weather") {
      const body = requireValidInput("internal_context_ingest_weather_input", await readJsonBody(req));
      return sendValidatedOutput(res, "internal_context_ingest_output", await ingestWeather(body));
    }

    if (req.method === "POST" && pathname === "/internal/context/ingest/events") {
      const body = requireValidInput("internal_context_ingest_events_input", await readJsonBody(req));
      return sendValidatedOutput(res, "internal_context_ingest_output", await ingestEvents(body));
    }

    if (req.method === "POST" && pathname === "/internal/context/ingest/payone-sim") {
      const body = requireValidInput("internal_context_ingest_payone_sim_input", await readJsonBody(req));
      return sendValidatedOutput(res, "internal_context_ingest_output", await ingestPayone(body));
    }

    if (req.method === "POST" && pathname === "/internal/generation/run") {
      const body = requireValidInput("internal_generation_run_input", await readJsonBody(req));
      return sendValidatedOutput(res, "internal_generation_run_output", await runGeneration(body));
    }

    if (req.method === "POST" && pathname === "/internal/merchant/scrape-profile") {
      const body = requireValidInput(
        "internal_merchant_scrape_profile_input",
        await readJsonBody(req)
      );
      return sendValidatedOutput(
        res,
        "internal_merchant_scrape_profile_output",
        await scrapeMerchantProfile(body)
      );
    }

    if (req.method === "POST" && pathname === "/internal/merchants") {
      const body = requireValidInput("internal_merchant_upsert_input", await readJsonBody(req));
      return sendValidatedOutput(res, "internal_merchant_upsert_output", await upsertMerchant(body));
    }

    if (req.method === "GET" && pathname === "/internal/merchants") {
      const mid = searchParams.get("merchant_id");
      const input = requireValidInput("internal_merchants_list_input", {
        merchant_id: mid && mid.length ? mid : undefined,
      });
      return sendValidatedOutput(res, "internal_merchants_list_output", await listMerchants(input));
    }

    if (req.method === "POST" && pathname === "/internal/merchants/approval") {
      const body = requireValidInput("internal_merchant_approval_input", await readJsonBody(req));
      return sendValidatedOutput(res, "internal_merchant_approval_output", await setMerchantApproval(body));
    }

      return notFound(res);
    } catch (error) {
      if (error instanceof SchemaValidationError) {
        const statusCode = error.direction === "input" ? 400 : 500;
        return sendJson(res, statusCode, {
          error:
            error.direction === "input"
              ? "schema_input_validation_failed"
              : "schema_output_validation_failed",
          schema: error.schemaName,
          details: error.details,
        });
      }
      return sendJson(res, 500, { error: "internal_error", message: error.message });
    }
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const server = createAppServer();
  server.listen(config.port, config.host, () => {
    const runtime = resolveIntentRuntimeSummary();
    if (!config.openRouterApiKey) {
      console.warn(
        "Warning: OPENROUTER_API_KEY is missing. Offer generation will run in deterministic fallback mode."
      );
    }
    console.log(
      `Intent runtime: provider=${runtime.intent_provider}, mode=${runtime.intent_mode}, model=${runtime.intent_model}`
    );
    console.log(`City Wallet server listening on http://${config.host}:${config.port}`);
  });
}
