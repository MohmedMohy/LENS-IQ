import type { ScoringInput, ScoreResult } from "../../shared/types/scoring.js";

import { calculateDTI } from "./dti.js";
import { evaluateRisk } from "./riskScore.js";
import { calculateAffordability } from "./affordability.js";

export function analyze(input: ScoringInput): ScoreResult {
    const dtiResult = calculateDTI(
        input.salary,
        input.installment,
        input.current_liabilities,
        input.employmentType
    );

    const dti = dtiResult.value;

    const risk = evaluateRisk(
        input.age,
        input.salary,
        dti,
        input.employmentType,
        input.iScore
    );

    const affordabilityScore = calculateAffordability(dti);

    return {
        dti,
        riskScore: risk.score,
        riskLevel: risk.level,
        affordabilityScore,
        riskFactors: risk.riskFactors,
    };
}