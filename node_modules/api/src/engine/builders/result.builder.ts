import type { EvaluationResult } from "../../shared/types/result.js";
import type { Decision } from "../../shared/types/decision.js";
import type { EvaluationContext } from "../types/context.js";

import { calculateLoan } from "../pricing/loanCalculator.js";

/**
 * Final Result Builder
 * - Decision aware
 * - Pricing integrated
 * - No business logic outside underwriting flow
 */
export function buildResult(
    programId: number,
    decision: Decision,
    ctx: EvaluationContext
): EvaluationResult {

    const pricing = calculateLoan(
        {
            loanAmount: ctx.input.price,
            annualRate: 0.25,
            months: 60,

            interestModifier:
                decision.reason.impact === "HIGH" ? 0.03 :
                    decision.reason.impact === "MEDIUM" ? 0.01 : 0,

            monthsModifier:
                decision.reason.impact === "HIGH" ? -6 :
                    decision.reason.impact === "MEDIUM" ? -3 : 0,
        },
        "reducing"
    );

    switch (decision.type) {

        case "REJECT":
            return {
                programId,
                status: "REJECTED",
                installment: 0,
                reasons: [decision.reason],
            };

        case "CONDITIONAL":
            return {
                programId,
                status: "CONDITIONAL",
                installment: pricing.installment,
                reasons: [decision.reason],
                interestModifier: pricing.interestAmount,
                maxMonthsModifier: pricing.months - 60,
            };

        case "APPROVE":
            return {
                programId,
                status: "APPROVED",
                installment: pricing.installment,
                reasons: [decision.reason],
                interestModifier: pricing.interestAmount,
                maxMonthsModifier: pricing.months - 60,
            };
    }
}