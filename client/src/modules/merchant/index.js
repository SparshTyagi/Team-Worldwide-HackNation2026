"use strict";

const { requestJson } = require("../../shared/http-client.js");

async function createRules({ baseUrl, authToken, payload }) {
  return requestJson({
    baseUrl,
    path: "/v1/merchant/rules",
    method: "POST",
    authToken,
    body: payload,
  });
}

async function patchRules({ baseUrl, authToken, merchantRuleId, payload }) {
  return requestJson({
    baseUrl,
    path: `/v1/merchant/rules/${encodeURIComponent(merchantRuleId)}`,
    method: "PATCH",
    authToken,
    body: payload,
  });
}

async function getDashboardOverview({ baseUrl, authToken, merchantId }) {
  return requestJson({
    baseUrl,
    path: `/v1/merchant/dashboard/overview?merchant_id=${encodeURIComponent(merchantId)}`,
    method: "GET",
    authToken,
  });
}

async function getDashboardFunnel({ baseUrl, authToken, merchantId }) {
  return requestJson({
    baseUrl,
    path: `/v1/merchant/dashboard/funnel?merchant_id=${encodeURIComponent(merchantId)}`,
    method: "GET",
    authToken,
  });
}

async function getDashboardContextPerformance({ baseUrl, authToken, merchantId }) {
  return requestJson({
    baseUrl,
    path: `/v1/merchant/dashboard/context-performance?merchant_id=${encodeURIComponent(merchantId)}`,
    method: "GET",
    authToken,
  });
}

module.exports = {
  createRules,
  patchRules,
  getDashboardOverview,
  getDashboardFunnel,
  getDashboardContextPerformance,
};
