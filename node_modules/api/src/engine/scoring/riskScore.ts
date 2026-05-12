import type { RiskLevel } from "../../shared/types/scoring.js";

/**
 * Risk scoring thresholds
 * (tunable configuration layer)
 */
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

/**
 * Core risk evaluation engine
 * - deterministic
 * - explainable scoring
 */
export function evaluateRisk(
    age: number,
    salary: number,
    dti: number
): { score: number; level: RiskLevel } {

    let score = 0;

    // =========================
    // 1. DTI FACTOR (highest weight)
    // =========================
    if (dti > DTI_THRESHOLDS.HIGH) score += 50;
    else if (dti > DTI_THRESHOLDS.MEDIUM_HIGH) score += 35;
    else if (dti > DTI_THRESHOLDS.MEDIUM) score += 20;
    else if (dti > DTI_THRESHOLDS.LOW) score += 10;

    // =========================
    // 2. SALARY FACTOR
    // =========================
    if (salary < SALARY_THRESHOLDS.LOW) score += 25;
    else if (salary < SALARY_THRESHOLDS.MEDIUM) score += 10;

    // =========================
    // 3. AGE FACTOR
    // =========================
    if (age > AGE_THRESHOLDS.HIGH) score += 30;
    else if (age > AGE_THRESHOLDS.MEDIUM) score += 15;

    // =========================
    // 4. NORMALIZATION
    // =========================
    const finalScore = Math.min(score, 100);

    // =========================
    // 5. RISK LEVEL MAPPING
    // =========================
    const level: RiskLevel =
        finalScore >= 70
            ? "HIGH"
            : finalScore >= 40
                ? "MEDIUM"
                : "LOW";

    return {
        score: finalScore,
        level,
    };
}