export type Reason = {
  type: "RULE" | "RISK" | "SYSTEM";
  message: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
};

export type EvaluationStatus =
  | "APPROVED"
  | "REJECTED"
  | "CONDITIONAL";

export interface EvaluationResult {
  programId: number;

  status: EvaluationStatus;

  installment: number;

  reasons: Reason[];

  interestModifier?: number;

  maxMonthsModifier?: number;

  calculationMethod?: "reducing" | "flat" | "murabaha";

  riskScore?: number;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  riskFactors?: string[];
}