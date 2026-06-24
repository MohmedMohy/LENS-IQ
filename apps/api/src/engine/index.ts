// src/engine/index.ts

export { compareOffers } from "./offers/compareOffers.js";
export { rankOffers, calculateProgramScore } from "./offers/Ranking.js";

export { evaluateApplication } from "./evaluation/evaluateApplication.js";
export { generateOffer } from "./offers/offerGenerator.js";

export { analyze } from "./scoring/scoring.js";

export { calculateLoan } from "./pricing/loanCalculator.js";