export type EvaluateRequest = {
    application_id: number;
};

export type ImpactLevel =
    | "LOW"
    | "MEDIUM"
    | "HIGH";

export type RiskLevel =
    | "LOW"
    | "MEDIUM"
    | "HIGH";

export type OfferStatus =
    | "APPROVED"
    | "CONDITIONAL"
    | "REJECTED";

export type Reason = {
    type: "RULE" | "RISK" | "SYSTEM";
    message: string;
    impact: ImpactLevel;
};

export type Offer = {
    programId: number;
    bankId: number;
    status: OfferStatus;
    installment: number;
    totalPayment: number;
    financeAmount: number;
    downPayment: number;
    interestRate: number;
    months: number;
    dti: number;
    riskScore: number;
    riskLevel: RiskLevel;
    affordabilityScore: number;
    reasons: Reason[];
};

export type EvaluateResponse = {
    bestOffer: Offer | null;
    offers: Offer[];
    error?: string;
};