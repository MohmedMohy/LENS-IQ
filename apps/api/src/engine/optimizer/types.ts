import type { Offer } from "../../shared/types/offer.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";

export type FailedRuleType =
  | "MAX_DTI"
  | "MIN_INCOME"
  | "MAX_TENURE"
  | "MIN_TENURE"
  | "MAX_FINANCE_AMOUNT"
  | "MIN_DOWN_PAYMENT"
  | "AGE"
  | "EMPLOYMENT"
  | "PROGRAM_RULE"
  | "BANK_POLICY"
  | "CUSTOM_RULE";

export type OptimizationSuggestionType =
  | "INCREASE_TENURE"
  | "DECREASE_TENURE"
  | "DECREASE_FINANCE_AMOUNT"
  | "INCREASE_DOWN_PAYMENT"
  | "SWITCH_PROGRAM"
  | "SWITCH_BANK"
  | "SWITCH_CALCULATION_METHOD"
  | "SEARCH_EMPLOYMENT_COMPATIBLE"
  | "SEARCH_AGE_COMPATIBLE";

export interface OptimizationSuggestion {
  type: OptimizationSuggestionType;
  label: string;
  currentValue?: string;
  suggestedValue: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
}

export interface ConstraintAnalysis {
  decision: "APPROVED" | "REJECTED" | "CONDITIONAL";
  failedRules: FailedRuleType[];
  reasons: string[];
  severity: number;
  suggestions: OptimizationSuggestion[];
}

export interface CandidateRequest {
  months: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  financeAmount: number;
  programId: number;
  bankId: number;
  calculationMethod: string;
}

export interface OptimizationExplanation {
  originalTenure: number;
  optimizedTenure: number;
  steps: string[];
  reason: string;
  changes: string[];
}

export interface OptimizationStep {
  step: number;
  action: string;
  details?: string;
}

export interface OptimizationTimeline {
  steps: OptimizationStep[];
}

export interface OptimizationSummary {
  evaluatedCandidates: number;
  approvedOffers: number;
  rejectedOffers: number;
  bestScore: number;
  optimizationTimeMs: number;
  maxDepthReached: number;
  candidatesGenerated: number;
}

export interface NearMissInfo {
  nearMiss: boolean;
  dtiDifference?: number;
  suggestions: string[];
}

export interface SmartOffer extends Offer {
  optimizationExplanation?: OptimizationExplanation;
  nearMiss?: NearMissInfo;
  deviationScore?: number;
  customerPreferenceScore?: number;
}

export interface SmartOptimizerResult {
  offers: SmartOffer[];
  timeline: OptimizationTimeline;
  summary: OptimizationSummary;
  visitedStates: number;
}

export function createCandidateKey(c: CandidateRequest): string {
  return `${c.bankId}:${c.programId}:${c.months}:${c.financeAmount}:${c.calculationMethod}:${c.downPaymentPercent}`;
}
