export type CalculationMethod = "reducing" | "flat" | "murabaha";

export type AmortizationRow = {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
};

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
    effectiveAnnualRate?: number;
    amortizationSchedule?: AmortizationRow[];
};