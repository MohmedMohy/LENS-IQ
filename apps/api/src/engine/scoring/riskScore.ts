import type { RiskLevel, EmploymentType } from "../../shared/types/scoring.js";

const BASE_SCORE = 20;

const SALARY_ADJUSTMENTS: Array<{ min: number; adj: number; label: string }> = [
    { min: 30000, adj: -15, label: 'Salary >= 30,000' },
    { min: 15000, adj: -5, label: 'Salary >= 15,000' },
    { min: 8000, adj: 0, label: 'Salary >= 8,000' },
    { min: 5000, adj: 10, label: 'Salary >= 5,000' },
    { min: 0, adj: 20, label: 'Salary < 5,000' },
];

const EMPLOYMENT_ADJUSTMENTS: Record<EmploymentType, number> = {
    government: -10,
    listed_private: -5,
    unlisted_private: 0,
    self_employed: 10,
    retired: 5,
};

const ISCORE_ADJUSTMENTS: Array<{ min: number; max: number; adj: number; label: string }> = [
    { min: 700, max: Infinity, adj: -15, label: 'i-Score Excellent' },
    { min: 600, max: 699, adj: -5, label: 'i-Score Good' },
    { min: 500, max: 599, adj: 10, label: 'i-Score Fair' },
    { min: 400, max: 499, adj: 20, label: 'i-Score Poor' },
    { min: -Infinity, max: 399, adj: 35, label: 'i-Score Bad' },
];

const RISK_LEVEL_THRESHOLDS = {
    HIGH: 65,
    MEDIUM: 35,
} as const;

export function evaluateRisk(
    age: number,
    salary: number,
    dti: number,
    employmentType?: EmploymentType,
    iScore?: number
): { score: number; level: RiskLevel; riskFactors: string[] } {

    let score = BASE_SCORE;
    const riskFactors: string[] = [];

    const dtiPenalty = Math.min(100, Math.max(0, dti)) * 0.3;
    score += dtiPenalty;
    if (dtiPenalty > 0) {
        riskFactors.push(`DTI penalty: +${dtiPenalty.toFixed(1)} pts`);
    }

    const salaryAdj = SALARY_ADJUSTMENTS.find(s => salary >= s.min);
    if (salaryAdj) {
        score += salaryAdj.adj;
        riskFactors.push(`${salaryAdj.label}: ${salaryAdj.adj >= 0 ? '+' : ''}${salaryAdj.adj} pts`);
    }

    if (age >= 25 && age <= 40) {
        score -= 5;
        riskFactors.push('Age 25-40: -5 pts');
    } else if (age < 25 || age > 50) {
        score += 5;
        riskFactors.push(`Age ${age < 25 ? '<25' : '>50'}: +5 pts`);
    }

    if (employmentType) {
        const adj = EMPLOYMENT_ADJUSTMENTS[employmentType];
        if (adj !== undefined) {
            score += adj;
            if (adj < 0) riskFactors.push(`Employment discount: ${adj} pts`);
            else if (adj > 0) riskFactors.push(`Employment penalty: +${adj} pts`);
        }
    }

    let iScoreForcedHigh = false;
    if (iScore !== undefined && iScore !== null) {
        const match = ISCORE_ADJUSTMENTS.find(
            (r) => iScore >= r.min && iScore <= r.max
        );
        if (match) {
            score += match.adj;
            riskFactors.push(`${match.label}: ${match.adj >= 0 ? '+' : ''}${match.adj} pts`);
            if (iScore < 400) {
                iScoreForcedHigh = true;
                riskFactors.push('i-Score below 400 — forced HIGH risk');
            }
        } else {
            score += 10;
            riskFactors.push('No i-Score record — treated as Fair');
        }
    }

    const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

    let level: RiskLevel;
    if (iScoreForcedHigh || finalScore >= RISK_LEVEL_THRESHOLDS.HIGH) {
        level = 'HIGH';
    } else if (finalScore >= RISK_LEVEL_THRESHOLDS.MEDIUM) {
        level = 'MEDIUM';
    } else {
        level = 'LOW';
    }

    return {
        score: finalScore,
        level,
        riskFactors,
    };
}
