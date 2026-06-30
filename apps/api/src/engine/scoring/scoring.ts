import type { ScoringInput as SharedScoringInput, ScoreResult } from "../../shared/types/scoring.js";
import type { ScoringProfile } from "./types.js";

import { calculateDTI } from "./dti.js";
import { ScoringEngine, DEFAULT_SCORING_PROFILE, DEFAULT_AFFORDABILITY_PROFILE } from "./ScoringEngine.js";

export function analyze(
    input: SharedScoringInput,
    options?: { riskProfile?: ScoringProfile; affordabilityProfile?: ScoringProfile }
): ScoreResult {
    const dtiResult = calculateDTI(
        input.salary,
        input.installment,
        input.current_liabilities,
        input.employmentType
    );

    const dti = dtiResult.value;

    const riskProfile = options?.riskProfile ?? DEFAULT_SCORING_PROFILE;
    const affordabilityProfile = options?.affordabilityProfile ?? DEFAULT_AFFORDABILITY_PROFILE;

    const riskResult = ScoringEngine.calculateRisk(
        { age: input.age, salary: input.salary, dti, employmentType: input.employmentType, iScore: input.iScore },
        riskProfile
    );

    const affordabilityScore = ScoringEngine.calculateAffordability(
        { age: input.age, salary: input.salary, dti, riskScore: riskResult.score, salaryTransfer: input.salaryTransfer, vehicleCondition: input.vehicleCondition, carAge: input.carAge },
        affordabilityProfile
    );

    return {
        dti,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        affordabilityScore,
        riskFactors: riskResult.adjustments.map((a) => a.reason),
    };
}
