import type { EvaluationContext } from "../types/context.js";
import { calculateDTI } from "../scoring/dti.js";
/**
 * =========================
 * Eligibility Layer (PURE CHECK)
 * =========================
 * - NO decision making
 * - NO buildResult
 * - ONLY computes risk metric
 * - returns signal only
 */
export function checkEligibility(
    ctx: EvaluationContext
): { dti: number; isEligible: boolean } {

    // =========================
    // 1. BASE DTI CALCULATION
    // =========================
    const dti = calculateDTI(
        ctx.input.salary,
        0,
        ctx.input.current_liabilities
    );

    // =========================
    // 2. HARD THRESHOLD CHECK
    // =========================
    const isEligible = dti <= 80;

    // =========================
    // 3. RETURN SIGNAL ONLY
    // =========================
    return {
        dti,
        isEligible,
    };
}