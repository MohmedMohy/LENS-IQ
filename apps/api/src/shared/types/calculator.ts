// src/types/calculator.ts

export type CalculationMethod = "reducing" | "flat" | "murabaha";

export type CalculationInput = {
    loanAmount: number;
    annualRate: number;
    months: number;
    interestModifier?: number;
    monthsModifier?: number;
    balloonPayment?: number;
    adminFees?: number;
    costPrice?: number;
    profitMarginPercent?: number;
};

export type CalculationResult = {
    installment: number;
    totalPayment: number;
    interestAmount: number;
    months: number;
    apr?: number;
    effectiveRate?: number;
    totalFinanceCostPercent?: number;
    adminFees?: number;
    balloonFinalPayment?: number;
};