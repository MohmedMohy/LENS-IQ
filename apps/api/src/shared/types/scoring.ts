/* =========================
   SCORING TYPES
========================= */

export type ScoringInput = {
    age: number;
    salary: number;
    installment: number;
    current_liabilities: number;
};
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ScoreResult = {
    dti: number; // %
    riskScore: number;
    riskLevel: RiskLevel; 
    affordabilityScore: number;
};