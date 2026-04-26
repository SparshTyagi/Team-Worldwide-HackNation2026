"use strict";

const {
  getDashboardOverview,
  getDashboardFunnel,
  getDashboardContextPerformance,
} = require("./index.js");

async function run() {
  const baseUrl = process.env.BRAIN_PROXY_BASE_URL || "http://localhost:8080";
  const authToken = process.env.BRAIN_PROXY_AUTH_TOKEN;
  const merchantId = process.env.MERCHANT_ID || "m_1021";

  const [overview, funnel, contextPerformance] = await Promise.all([
    getDashboardOverview({ baseUrl, authToken, merchantId }),
    getDashboardFunnel({ baseUrl, authToken, merchantId }),
    getDashboardContextPerformance({ baseUrl, authToken, merchantId }),
  ]);

  console.log("Overview:", overview);
  console.log("Funnel:", funnel);
  console.log("Context performance:", contextPerformance);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
