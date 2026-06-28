import type { EvaluationStatus } from "./result.js";

export type Offer = {
  programId: number;
  bankId: number;
  programName?: string;
  bankName?: string;
  status: EvaluationStatus;
  installment: number;
  totalPayment: number;
  interestRate: number;
  months: number;
  financeAmount: number;
  downPayment: number;
  dti: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  affordabilityScore: number;
  approvalProbability: number;
  programScore?: number;
  reasons?: Array<{ type: string; message: string; impact: string }>;
  effectiveAnnualRate?: number;
  tenor?: number;
  downPaymentPct?: number;
  downPaymentAmount?: number;
  loanAmount?: number;
  LTV?: number;
  calculationMethod?: string;
};

export type OptimizationSuggestion = {
  type: "DOWN_PAYMENT" | "DURATION" | "PROGRAM";
  label: string;
  currentValue?: string;
  suggestedValue: string;
  currentApproval?: number;
  projectedApproval: number;
  impact: "HIGH" | "MEDIUM" | "LOW";
};

