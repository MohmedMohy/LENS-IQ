// src/engine/index.ts

export { compareOffers } from "./offers/compareOffers.js";
export { rankOffers } from "./offers/Ranking.js";

export { evaluateApplication } from "./evaluation/evaluateApplication.js";
export { generateOffer } from "./offers/offerGenerator.js";

// scoring entry (NOT wrapper)
export { analyze } from "./scoring/scoring.js";