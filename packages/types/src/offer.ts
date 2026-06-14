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
  reasons: Reason[];
}
