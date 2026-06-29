import type { ScoringRuleConfig, ScoreAdjustmentResult } from "../rules/types.js";

export interface ScoringProfile {
  id: string;
  name: string;
  baseScore: number;
  rules: ScoringRuleConfig[];
  thresholds: {
    high: number;
    medium: number;
  };
}

export interface ScoringResult {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH";
  adjustments: ScoreAdjustmentResult[];
}

export interface ScoringInput {
  age: number;
  salary: number;
  dti: number;
  employmentType?: string;
  iScore?: number;
  salaryTransfer?: boolean;
  vehicleCondition?: string;
  carAge?: number;
  riskScore?: number;
}
