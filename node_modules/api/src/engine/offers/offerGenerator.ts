import type { Program } from "../../shared/types/program.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { EvaluationResult, EvaluationStatus } from "../../shared/types/result.js";
import type { Offer } from "../../shared/types/offer.js";

import { calculateLoan } from "../pricing/loanCalculator.js";
import { analyze } from "../scoring/scoring.js";

const MAX_ALLOWED_DTI = 65;

/**
 * Offer Generator
 * - converts evaluation → financial offer
 * - applies pricing + risk + scoring
 */
export function generateOffer(
    input: ApplicationInput,
    program: Program,
    evaluation: EvaluationResult
): Offer {

    // =========================
    // 1. REJECTED CASE
    // =========================
    if (evaluation.status === "REJECTED") {
        return {
            programId: program.id,
            bankId: program.bankId,

            financeAmount: 0,

            status: "REJECTED",
            installment: 0,
            totalPayment: 0,

            interestRate: program.interestRate,
            months: program.maxMonths,

            dti: 0,
            riskScore: 100,
            riskLevel: "HIGH",
            affordabilityScore: 0,

            reasons: evaluation.reasons,
        };
    }

    // =========================
    // 2. APPLY MODIFIERS
    // =========================
    const finalMonths =
        program.maxMonths + (evaluation.maxMonthsModifier || 0);

    const finalInterestRate =
        program.interestRate + (evaluation.interestModifier || 0);

    // =========================
    // 3. DOWN PAYMENT LOGIC
    // =========================
    const minBankDownPayment =
        input.price * (program.minDownPaymentPercent / 100);

    const actualDownPayment = Math.max(
        minBankDownPayment,
        input.requestedDownPayment || 0
    );

    const loanAmount = Math.max(0, input.price - actualDownPayment);

    const financeAmount = loanAmount;

    // =========================
    // 4. LOAN CALCULATION
    // =========================
    const calc = calculateLoan({
        loanAmount,
        annualRate: finalInterestRate,
        months: finalMonths,
    });

    // =========================
    // 5. SCORING
    // =========================
    const finalScore = analyze({
        age: input.age,
        salary: input.salary,
        installment: calc.installment,
        current_liabilities: input.current_liabilities,
    });

    // =========================
    // 6. FINAL STATUS LOGIC
    // =========================
    let finalStatus: EvaluationStatus =
        finalScore.riskLevel === "HIGH"
            ? "REJECTED"
            : evaluation.status;

    const finalReasons = [...evaluation.reasons];

    if (finalScore.dti > MAX_ALLOWED_DTI) {
        finalStatus = "REJECTED";

        finalReasons.push({
            type: "RISK",
            message: `Final DTI (${finalScore.dti}%) exceeds max limit (${MAX_ALLOWED_DTI}%)`,
            impact: "HIGH",
        });
    }

    // =========================
    // 7. FINAL OFFER
    // =========================
    return {
        programId: program.id,
        bankId: program.bankId,

        financeAmount,

        status: finalStatus,

        installment: calc.installment,
        totalPayment: calc.totalPayment,

        interestRate: finalInterestRate,
        months: finalMonths,

        dti: finalScore.dti,
        riskScore: finalScore.riskScore,
        riskLevel: finalScore.riskLevel,
        affordabilityScore: finalScore.affordabilityScore,

        reasons: finalReasons,
    };
}