import type { CalculationInput, CalculationResult } from "../../shared/types/calculator.js";

function toMoney(v: number): number {
    return Math.round(v * 100) / 100;
}

function applyModifiers(input: CalculationInput): CalculationInput {
    return {
        ...input,
        annualRate: input.annualRate + (input.interestModifier ?? 0),
        months: Math.max(1, input.months + (input.monthsModifier ?? 0)),
    };
}

export function calculateReducing(input: CalculationInput): CalculationResult {
    const i = applyModifiers(input);
    const r = i.annualRate / 12 / 100;

    if (r === 0 || i.loanAmount === 0) {
        const installment = i.months > 0 ? toMoney(i.loanAmount / i.months) : 0;
        return {
            installment,
            totalPayment: toMoney(installment * i.months),
            interestAmount: 0,
            months: i.months,
            effectiveRate: 0,
            totalFinanceCostPercent: 0,
        };
    }

    const factor = Math.pow(1 + r, i.months);
    const rawInstallment = (i.loanAmount * r * factor) / (factor - 1);
    const installment = toMoney(rawInstallment);
    const totalPayment = toMoney(installment * i.months);

    const effectiveRate = (Math.pow(1 + r, 12) - 1) * 100;
    const totalFinanceCostPercent = ((totalPayment - i.loanAmount) / i.loanAmount) * 100;

    return {
        installment,
        totalPayment,
        interestAmount: toMoney(totalPayment - i.loanAmount),
        months: i.months,
        effectiveRate: toMoney(effectiveRate),
        totalFinanceCostPercent: toMoney(totalFinanceCostPercent),
    };
}

export function calculateFlat(input: CalculationInput): CalculationResult {
    const i = applyModifiers(input);
    const annualRate = i.annualRate / 100;

    const interestAmount = toMoney(i.loanAmount * annualRate * (i.months / 12));
    const totalPayment = toMoney(i.loanAmount + interestAmount);
    const installment = i.months > 0 ? toMoney(totalPayment / i.months) : 0;

    const effectiveRate = Math.pow(1 + (annualRate / 12), 12) - 1;
    const totalFinanceCostPercent = i.loanAmount > 0 ? ((totalPayment - i.loanAmount) / i.loanAmount) * 100 : 0;

    return {
        installment,
        totalPayment,
        interestAmount,
        months: i.months,
        effectiveRate: toMoney(effectiveRate * 100),
        totalFinanceCostPercent: toMoney(totalFinanceCostPercent),
    };
}

export function calculateMurabaha(input: CalculationInput): CalculationResult {
    const i = applyModifiers(input);
    const costPrice = i.costPrice ?? i.loanAmount;
    const profitMarginPct = i.profitMarginPercent ?? i.annualRate;

    const profitAmount = toMoney(costPrice * (profitMarginPct / 100));
    const sellingPrice = toMoney(costPrice + profitAmount);
    const installment = i.months > 0 ? toMoney(sellingPrice / i.months) : 0;
    const totalPayment = toMoney(installment * i.months);

    return {
        installment,
        totalPayment,
        interestAmount: profitAmount,
        months: i.months,
        effectiveRate: 0,
        totalFinanceCostPercent: toMoney((profitAmount / costPrice) * 100),
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