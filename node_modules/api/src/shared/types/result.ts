/* =========================
   REASON TYPE
========================= */
export type Reason = {
  type: "RULE" | "RISK" | "SYSTEM";
  message: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
};

/* =========================
    EVALUATION STATUS
========================= */
export type EvaluationStatus =
  | "APPROVED"
  | "REJECTED"
  | "CONDITIONAL";

/* =========================
    EVALUATION RESULT
========================= */
export interface EvaluationResult {

  /**
   * Program that evaluated the application
   */
  programId: number;

  /**
   * Final decision status
   */
  status: EvaluationStatus;

  /**
   * Final calculated installment (pricing engine output)
   * NOTE: may be 0 if pricing engine not executed yet
   */
  installment: number;

  /**
   * Explainability layer (WHY this decision happened)
   */
  reasons: Reason[];

  /**
   * Risk-based interest adjustment (+/- %)
   */
  interestModifier?: number;

  /**
   * Adjustment to max allowed months
   * positive = increase flexibility
   * negative = stricter terms
   */
  maxMonthsModifier?: number;
}