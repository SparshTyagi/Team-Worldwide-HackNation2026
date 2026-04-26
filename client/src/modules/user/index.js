"use strict";

const { ClientBrain } = require("./brain/orchestration/brain.js");
const { SecureStore } = require("./brain/storage/secure-store.js");
const schemas = require("./brain/contracts/schemas.js");
const { generateOfferCard } = require("./ai/offer-generator.js");

module.exports = {
  ClientBrain,
  SecureStore,
  schemas,
  generateOfferCard,
};
