"use strict";

const { validateConsentMask } = require("../contracts/schemas.js");

function applyConsentGates({ features, consentMask }) {
  validateConsentMask(consentMask);
  const gated = { ...features };

  if (!consentMask.precise_location) {
    delete gated.lat;
    delete gated.lon;
  }
  if (!consentMask.background_location) {
    gated.background_scans_enabled = false;
  }
  if (!consentMask.learn_from_accepted_offers) {
    gated.accept_history = [];
  }
  if (!consentMask.learn_from_dismissed_offers) {
    gated.dismiss_history = [];
  }
  if (!consentMask.learn_from_redeemed_offers) {
    gated.redeem_history = [];
  }
  if (!consentMask.push_notifications) {
    gated.channel_hint = "in_app_only";
  }
  if (!consentMask.anonymous_merchant_analytics) {
    gated.analytics_opt_out = true;
  }

  return gated;
}

module.exports = { applyConsentGates };
