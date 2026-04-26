import http from "http";
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
} from "./services/offer-service.js";
import {
  createRules,
  patchRules,
  dashboardOverview,
  dashboardFunnel,
  dashboardContextPerformance,
} from "./services/merchant-service.js";
import {
  ingestWeather,
  ingestEvents,
  ingestPayone,
  runGeneration,
  scrapeMerchantProfile,
  upsertMerchant,
  listMerchants,
} from "./services/internal-service.js";

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

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname, searchParams } = url;

    if (req.method === "GET" && pathname === "/health") {
      return sendValidatedOutput(res, "health_output", {
        ok: true,
        llm_model: config.llmModel ?? undefined,
      });
    }

    if (req.method === "POST" && pathname === "/v1/intent-signal") {
      const body = requireValidInput("intent_signal_input", await readJsonBody(req));
      return sendValidatedOutput(res, "intent_signal_output", await ingestIntent(body));
    }

    if (req.method === "GET" && pathname === "/v1/offers/active") {
      const locality = searchParams.get("locality") ? JSON.parse(searchParams.get("locality")) : undefined;
      const query = requireValidInput("get_active_offers_input", {
        user_pseudonym: searchParams.get("user_pseudonym"),
        channel: searchParams.get("channel") || "in_app",
        locality,
      });
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
      const out = recordDecision(body);
      if (out.error) return badRequest(res, out.error);
      return sendValidatedOutput(res, "offer_decision_output", out);
    }

    if (req.method === "POST" && pathname === "/v1/redemption/create-token") {
      const body = requireValidInput("redemption_create_token_input", await readJsonBody(req));
      return sendValidatedOutput(
        res,
        "redemption_create_token_output",
        createRedemptionToken(body)
      );
    }

    if (req.method === "POST" && pathname === "/v1/redemption/validate") {
      const body = requireValidInput("redemption_validate_input", await readJsonBody(req));
      const out = validateRedemption(body);
      if (out.error) return badRequest(res, out.error);
      return sendValidatedOutput(res, "redemption_validate_output", out);
    }

    if (req.method === "GET" && pathname === "/v1/wallet/cashback") {
      const input = requireValidInput("wallet_cashback_input", {
        user_pseudonym: searchParams.get("user_pseudonym"),
      });
      return sendValidatedOutput(res, "wallet_cashback_output", getCashback(input.user_pseudonym));
    }

    if (req.method === "POST" && pathname === "/v1/merchant/rules") {
      const body = requireValidInput("merchant_rules_create_input", await readJsonBody(req));
      return sendValidatedOutput(res, "merchant_rules_create_output", await createRules(body));
    }

    if (req.method === "PATCH" && pathname.startsWith("/v1/merchant/rules/")) {
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
      const input = requireValidInput("merchant_dashboard_input", {
        merchant_id: searchParams.get("merchant_id") || "m_1021",
      });
      return sendValidatedOutput(
        res,
        "merchant_dashboard_overview_output",
        await dashboardOverview(input.merchant_id)
      );
    }

    if (req.method === "GET" && pathname === "/v1/merchant/dashboard/funnel") {
      const input = requireValidInput("merchant_dashboard_input", {
        merchant_id: searchParams.get("merchant_id") || "m_1021",
      });
      return sendValidatedOutput(
        res,
        "merchant_dashboard_funnel_output",
        await dashboardFunnel(input.merchant_id)
      );
    }

    if (req.method === "GET" && pathname === "/v1/merchant/dashboard/context-performance") {
      const input = requireValidInput("merchant_dashboard_input", {
        merchant_id: searchParams.get("merchant_id") || "m_1021",
      });
      return sendValidatedOutput(
        res,
        "merchant_dashboard_context_performance_output",
        await dashboardContextPerformance(input.merchant_id)
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

server.listen(config.port, config.host, () => {
  if (!config.openRouterApiKey) {
    console.warn(
      "Warning: OPENROUTER_API_KEY is missing. Offer generation will run in deterministic fallback mode."
    );
  }
  console.log(`City Wallet server listening on http://${config.host}:${config.port}`);
});
