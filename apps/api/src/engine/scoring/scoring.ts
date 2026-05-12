import type { ScoringInput, ScoreResult } from "../../shared/types/scoring.js";

import { calculateDTI } from "./dti.js";
import { evaluateRisk } from "./riskScore.js";
import { calculateAffordability } from "./affordability.js";

/**
 * Main scoring pipeline
 * - deterministic
 * - composable
 * - no side effects
 */
export function analyze(input: ScoringInput): ScoreResult {

    const dti = calculateDTI(
        input.salary,
        input.installment,
        input.current_liabilities
    );

    const risk = evaluateRisk(
        input.age,
        input.salary,
        dti
    );

    const affordabilityScore = calculateAffordability(dti);

    return {
        dti,
        riskScore: risk.score,
        riskLevel: risk.level,
        affordabilityScore,
    };
}