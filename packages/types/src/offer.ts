export type OfferStatus = "APPROVED" | "CONDITIONAL" | "REJECTED";
export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Reason {
  type: "RULE" | "RISK" | "SYSTEM";
  message: string;
  impact: ImpactLevel;
}

export interface Offer {
  programId: number;
  bankId: number;
  programName?: string;
  bankName?: string;
  status: OfferStatus;
  installment: number;
  totalPayment: number;
  financeAmount: number;
  downPayment: number;
  interestRate: number;
  months: number;
  dti: number;
  riskScore: number;
  riskLevel: RiskLevel;
  affordabilityScore: number;
  approvalProbability: number;
  reasons: Reason[];
}

export interface OptimizationSuggestion {
  type: "DOWN_PAYMENT" | "DURATION" | "PROGRAM";
  label: string;
  currentValue?: string;
  suggestedValue: string;
  currentApproval?: number;
  projectedApproval: number;
  impact: "HIGH" | "MEDIUM" | "LOW";
}
