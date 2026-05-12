// src/types/calculator.ts
export type CalculationInput = {
    loanAmount: number;
    annualRate: number;
    months: number;
    interestModifier?: number;   // +/- %
    monthsModifier?: number;     // +/- months
};

export type CalculationResult = {
    installment: number;
    totalPayment: number;
    interestAmount: number;
    months: number;
};