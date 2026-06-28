export { compareOffers, compareOffersDetailed } from "./offers/compareOffers.js";
export { rankOffers, calculateProgramScore } from "./offers/Ranking.js";
export { evaluateApplication } from "./evaluation/evaluateApplication.js";
export { generateOffer } from "./offers/offerGenerator.js";
export { analyze } from "./scoring/scoring.js";
export { calculateLoan } from "./pricing/loanCalculator.js";

export { smartOptimize } from "./optimizer/optimizer.js";
export { analyzeConstraints } from "./optimizer/ConstraintAnalyzer.js";
export { generateCandidates } from "./optimizer/CandidateGenerator.js";
export { rankOffersSmart, computeCustomerPreferenceScore, computeDeviationScore } from "./optimizer/RankingEngine.js";
export { DEFAULT_OPTIMIZER_CONFIG } from "./optimizer/config.js";

export type { CompareOffersResult, RankedOffer, RejectedOffer } from "../shared/types/compareResult.js";
export type { Offer } from "../shared/types/offer.js";
export type {
  SmartOffer,
  SmartOptimizerResult,
  ConstraintAnalysis,
  OptimizationExplanation,
  OptimizationStep,
  OptimizationTimeline,
  OptimizationSummary,
  NearMissInfo,
  CandidateRequest,
  OptimizationSuggestion,
  FailedRuleType,
} from "./optimizer/types.js";
export type { OptimizerConfig } from "./optimizer/config.js";