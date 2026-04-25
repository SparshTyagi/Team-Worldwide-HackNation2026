const { generateOfferCard } = require("./offer-generator.js");

const env = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTEROFFERMODEL: process.env.OPENROUTEROFFERMODEL,
  OPENROUTER_OFFER_MODEL: process.env.OPENROUTER_OFFER_MODEL,
};

async function main() {
  const result = await generateOfferCard({
    env,
    contextInput: {
      weather: "11C overcast",
      intent_label: "warm_break_seek",
      merchant_category: "cafe",
      distance_meters: 80,
      time_bucket: "lunch",
    },
  });

  console.log("Model:", result.model);
  console.log("Offer JSON:", result.offer);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
