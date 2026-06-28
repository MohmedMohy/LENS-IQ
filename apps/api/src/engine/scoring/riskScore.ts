import type { RiskLevel, EmploymentType } from "../../shared/types/scoring.js";

const DTI_THRESHOLDS = {
    HIGH: 60,
    MEDIUM_HIGH: 50,
    MEDIUM: 40,
    LOW: 30,
} as const;

const SALARY_THRESHOLDS = {
    LOW: 4000,
    MEDIUM: 7000,
} as const;

const AGE_THRESHOLDS = {
    HIGH: 60,
    MEDIUM: 50,
} as const;

const EMPLOYMENT_ADJUSTMENTS: Record<EmploymentType, number> = {
    government: -10,
    listed_private: -5,
    unlisted_private: 0,
    self_employed: 10,
    retired: -5,
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

    let score = 0;
    const riskFactors: string[] = [];

    if (dti > DTI_THRESHOLDS.HIGH) {
        score += 50;
        riskFactors.push('DTI exceeds 60%');
    } else if (dti > DTI_THRESHOLDS.MEDIUM_HIGH) {
        score += 35;
        riskFactors.push('DTI between 50-60%');
    } else if (dti > DTI_THRESHOLDS.MEDIUM) {
        score += 20;
        riskFactors.push('DTI between 40-50%');
    } else if (dti > DTI_THRESHOLDS.LOW) {
        score += 10;
        riskFactors.push('DTI between 30-40%');
    }

    if (salary < SALARY_THRESHOLDS.LOW) {
        score += 25;
        riskFactors.push('Low salary bracket');
    } else if (salary < SALARY_THRESHOLDS.MEDIUM) {
        score += 10;
        riskFactors.push('Medium salary bracket');
    }

    if (age > AGE_THRESHOLDS.HIGH) {
        score += 30;
        riskFactors.push('Age exceeds 60');
    } else if (age > AGE_THRESHOLDS.MEDIUM) {
        score += 15;
        riskFactors.push('Age exceeds 50');
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

    const finalScore = Math.min(Math.max(score, 0), 100);

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
