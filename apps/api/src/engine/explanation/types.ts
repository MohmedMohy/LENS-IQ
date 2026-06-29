import type { RuleResult } from "../rules/types.js";
import type { Reason } from "../../shared/types/result.js";

export interface ExplanationFactor {
  name: string;
  value: string | number;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  weight: number;
  details: string;
}

export interface OfferExplanation {
  programId: number;
  bankId: number;
  overall: "APPROVED" | "CONDITIONAL" | "REJECTED";
  approvalProbability: number;
  confidence: number;

  passedRules: RuleResult[];
  failedRules: RuleResult[];
  skippedRules: RuleResult[];

  riskFactors: ExplanationFactor[];
  advantages: string[];
  disadvantages: string[];

  customerMatchScore: number;
  recommendation: string;

  decisionTrace: DecisionTraceStep[];
}

export interface DecisionTraceStep {
  step: number;
  module: string;
  action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
}

export interface ExplanationSummary {
  totalOffers: number;
  approvedCount: number;
  conditionalCount: number;
  rejectedCount: number;
  bestOffer?: {
    programName: string;
    bankName: string;
    approvalProbability: number;
    reasons: string[];
  };
}
