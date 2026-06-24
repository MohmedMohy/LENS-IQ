export type DecisionStatus = "APPROVED" | "CONDITIONAL" | "REJECTED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH";

export type DecisionReason = {
  message: string;
  impact: RiskLevel;
};

export type DecisionResult = {
  status: DecisionStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  dti: number;
  installment: number;
  totalPayment: number;
  reasons: DecisionReason[];
};
