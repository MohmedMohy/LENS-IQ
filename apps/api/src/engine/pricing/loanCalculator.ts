import type { CalculationInput, CalculationResult } from "../../shared/types/calculator.js";

/**
 * RATE CONVENTION (enforced here, must match DB):
 * - annualRate is stored as percentage:  14.5 → 14.5% per year
 * - interestModifier is also percentage: 10   → +10% on top of base rate
 * - monthly rate = annualRate / 12 / 100
 */

function applyModifiers(input: CalculationInput): CalculationInput {
    const interestModifier = input.interestModifier ?? 0;
    const monthsModifier = input.monthsModifier ?? 0;

    return {
        ...input,
        annualRate: input.annualRate + interestModifier,
        months: Math.max(1, input.months + monthsModifier),
    };
}

export function calculateReducing(input: CalculationInput): CalculationResult {
    const i = applyModifiers(input);
    const r = i.annualRate / 12 / 100;

    if (r === 0) {
        const installment = i.loanAmount / i.months;
        return {
            installment,
            totalPayment: installment * i.months,
            interestAmount: 0,
            months: i.months,
        };
    }

    const factor = Math.pow(1 + r, i.months);
    const installment = (i.loanAmount * r * factor) / (factor - 1);
    const totalPayment = installment * i.months;

    return {
        installment,
        totalPayment,
        interestAmount: totalPayment - i.loanAmount,
        months: i.months,
    };
}

export function calculateFlat(input: CalculationInput): CalculationResult {
    const i = applyModifiers(input);
    const annualRate = i.annualRate / 100;

    const interestAmount = i.loanAmount * annualRate * (i.months / 12);
    const totalPayment = i.loanAmount + interestAmount;
    const installment = totalPayment / i.months;

    return { installment, totalPayment, interestAmount, months: i.months };
}

export function calculateMurabaha(input: CalculationInput): CalculationResult {
    const i = applyModifiers(input);
    const annualRate = i.annualRate / 100;

    const profitAmount = i.loanAmount * annualRate * (i.months / 12);
    const totalPayment = i.loanAmount + profitAmount;
    const installment = totalPayment / i.months;

    return {
        installment,
        totalPayment,
        interestAmount: profitAmount,
        months: i.months,
    };
}

export function calculateLoan(
    input: CalculationInput,
    method: "reducing" | "flat" | "murabaha" = "reducing"
): CalculationResult {
    if (input.loanAmount <= 0 || input.months <= 0) {
        throw new Error("Invalid calculation input");
    }

    switch (method) {
        case "flat": return calculateFlat(input);
        case "murabaha": return calculateMurabaha(input);
        default: return calculateReducing(input);
    }
}