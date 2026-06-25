import type { OfferStatus, RiskLevel, Reason } from "@/types";

export type DecisionStatus = OfferStatus;
export type { RiskLevel, Reason };

export type DecisionResult = {
  status: DecisionStatus;
  installment: number;
  totalPayment: number;
  dti: number;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: Reason[];
};
