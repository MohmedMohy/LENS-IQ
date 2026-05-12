// src/types/offer.ts

import type { EvaluationStatus } from "./result.js"; //  import الجديد
export type Offer = {
  programId: number;
  bankId: number;
  status: EvaluationStatus;  // مهم
  installment: number;
  totalPayment: number;
  interestRate: number;
  months: number;
  financeAmount: number;
  dti: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  affordabilityScore: number;
  reasons?: any[]; //  لتضمين أسباب الرفض أو التعديل في العرض
};

