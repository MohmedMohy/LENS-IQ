import type { EvaluationResult } from "../../shared/types/result.js";
import type { Decision } from "../../shared/types/decision.js";
import type { EvaluationContext } from "../types/context.js";

/**
 * Builds a clean EvaluationResult from a decision.
 *
 * IMPORTANT: This builder does NOT calculate pricing.
 * Pricing (installment, totalPayment, dti, risk) is the responsibility
 * of offerGenerator.ts, which has access to the real program rates.
 * installment is intentionally 0 here — offerGenerator overwrites it.
 */
export function buildResult(
    programId: number,
    decision: Decision,
    ctx: EvaluationContext
): EvaluationResult {
    const reasons = [...ctx.reasons, decision.reason];

    if (decision.type === "REJECT") {
        return {
            programId,
            status: "REJECTED",
            installment: 0,
            reasons,
        };
    }

    if (decision.type === "CONDITIONAL") {
        return {
            programId,
            status: "CONDITIONAL",
            installment: 0,
            reasons,
        };
    }

    return {
        programId,
        status: "APPROVED",
        installment: 0,
        reasons,
    };
}