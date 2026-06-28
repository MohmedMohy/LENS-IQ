import type { CalculationInput, CalculationResult, AmortizationRow } from "../../shared/types/calculator.js";

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

function buildAmortizationReducing(
    loanAmount: number,
    monthlyRate: number,
    monthlyPayment: number,
    months: number
): AmortizationRow[] {
    const schedule: AmortizationRow[] = [];
    let balance = loanAmount;
    for (let m = 1; m <= months; m++) {
        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        balance = Math.max(0, balance - principal);
        schedule.push({
            month: m,
            payment: toMoney(monthlyPayment),
            principal: toMoney(principal),
            interest: toMoney(interest),
            balance: toMoney(balance),
        });
    }
    return schedule;
}

function computeIRR(cashflows: number[], guess: number = 0.01): number {
    const maxIter = 1000;
    const tol = 1e-8;
    let rate = guess;

    for (let iter = 0; iter < maxIter; iter++) {
        let npv = 0;
        let dnpv = 0;
        for (let t = 0; t < cashflows.length; t++) {
            const denom = Math.pow(1 + rate, t);
            npv += cashflows[t] / denom;
            dnpv -= (t * cashflows[t]) / Math.pow(1 + rate, t + 1);
        }
        if (Math.abs(npv) < tol) break;
        if (Math.abs(dnpv) < 1e-12) break;
        rate = rate - npv / dnpv;
        if (rate <= -1) { rate = -0.99999; }
    }
    return rate;
}

function effectiveAPRFromMonthlyPayment(
    principal: number,
    monthlyPayment: number,
    months: number
): number {
    if (principal <= 0 || monthlyPayment <= 0 || months <= 0) return 0;
    const cashflows: number[] = [-principal];
    for (let t = 0; t < months; t++) {
        cashflows.push(monthlyPayment);
    }
    const monthlyRate = computeIRR(cashflows);
    const effectiveAnnual = (Math.pow(1 + monthlyRate, 12) - 1) * 100;
    return toMoney(effectiveAnnual);
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
            effectiveAnnualRate: 0,
            totalFinanceCostPercent: 0,
            amortizationSchedule: buildAmortizationReducing(i.loanAmount, 0, installment, i.months),
        };
    }

    const factor = Math.pow(1 + r, i.months);
    const rawInstallment = (i.loanAmount * r * factor) / (factor - 1);
    const installment = toMoney(rawInstallment);
    const totalPayment = toMoney(installment * i.months);
    const totalInterest = toMoney(totalPayment - i.loanAmount);

    const effectiveRate = (Math.pow(1 + r, 12) - 1) * 100;
    const totalFinanceCostPercent = i.loanAmount > 0 ? ((totalPayment - i.loanAmount) / i.loanAmount) * 100 : 0;

    return {
        installment,
        totalPayment,
        interestAmount: totalInterest,
        months: i.months,
        effectiveRate: toMoney(effectiveRate),
        effectiveAnnualRate: toMoney(effectiveRate),
        totalFinanceCostPercent: toMoney(totalFinanceCostPercent),
        amortizationSchedule: buildAmortizationReducing(i.loanAmount, r, installment, i.months),
    };
}

export function calculateFlat(input: CalculationInput): CalculationResult {
    const i = applyModifiers(input);
    const annualRate = i.annualRate / 100;

    const totalInterest = toMoney(i.loanAmount * annualRate * (i.months / 12));
    const totalPayment = toMoney(i.loanAmount + totalInterest);
    const installment = i.months > 0 ? toMoney(totalPayment / i.months) : 0;

    const totalFinanceCostPercent = i.loanAmount > 0 ? ((totalPayment - i.loanAmount) / i.loanAmount) * 100 : 0;

    const effectiveAnnualRate = effectiveAPRFromMonthlyPayment(i.loanAmount, installment, i.months);

    return {
        installment,
        totalPayment,
        interestAmount: totalInterest,
        months: i.months,
        effectiveRate: toMoney(((Math.pow(1 + annualRate / 12, 12) - 1) * 100)),
        effectiveAnnualRate,
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

    const totalFinanceCostPercent = costPrice > 0 ? ((profitAmount / costPrice) * 100) : 0;

    const effectiveAnnualRate = effectiveAPRFromMonthlyPayment(costPrice, installment, i.months);

    return {
        installment,
        totalPayment,
        interestAmount: profitAmount,
        months: i.months,
        effectiveRate: toMoney(effectiveAnnualRate),
        effectiveAnnualRate,
        totalFinanceCostPercent: toMoney(totalFinanceCostPercent),
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
