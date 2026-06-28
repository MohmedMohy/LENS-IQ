export type EmploymentType = 'government' | 'listed_private' | 'unlisted_private' | 'self_employed' | 'retired';

export type ScoringInput = {
    age: number;
    salary: number;
    installment: number;
    current_liabilities: number;
    employmentType?: EmploymentType;
    iScore?: number;
};
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ScoreResult = {
    dti: number;
    riskScore: number;
    riskLevel: RiskLevel;
    affordabilityScore: number;
    riskFactors?: string[];
};