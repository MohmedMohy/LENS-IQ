// ============================================================================
// Legacy API — preserved for backward compatibility
// ============================================================================
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

// ============================================================================
// New Engine Modules
// ============================================================================
export { RuleEngine } from "./rules/RuleEngine.js";
export { applyOperator, applyExtendedOperator, checkAllSupportedOperators } from "./rules/operators.js";
export type {
  RuleResult,
  RuleResultStatus,
  RuleEvaluationContext,
  ExtendedRuleOperator,
  ScoringRuleConfig,
  ScoringRuleSet,
  ScoreAdjustmentResult,
} from "./rules/types.js";

export { ScoringEngine, DEFAULT_SCORING_PROFILE, DEFAULT_AFFORDABILITY_PROFILE } from "./scoring/index.js";
export type { ScoringProfile, ScoringResult, ScoringInput } from "./scoring/types.js";

export { RankingService } from "./ranking/RankingService.js";
export type { RankingWeights, RankingContext, RankedOffer as RankedOfferNew, RankingProfile, RankingStrategy } from "./ranking/types.js";
export { DEFAULT_WEIGHTS } from "./ranking/types.js";

export { PipelineEngine } from "./pipeline/PipelineEngine.js";
export { ValidationStep } from "./pipeline/steps/ValidationStep.js";
export type { PipelineInput, PipelineState, PipelineStep, PipelineResult } from "./pipeline/types.js";

export { ExplanationBuilder } from "./explanation/ExplanationBuilder.js";
export type { OfferExplanation, ExplanationFactor, DecisionTraceStep, ExplanationSummary } from "./explanation/types.js";

export { DecisionTrace } from "./audit/DecisionTrace.js";
export type { AuditEntry, AuditPipelineStep, AuditStoreEntry, DecisionTraceShort } from "./audit/types.js";

export type { WithTenant, WithTimestamps, DeepPartial } from "./shared/types.js";
