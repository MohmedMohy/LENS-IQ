// src/features/evaluate/api/evaluate.api.ts

import { apiClient } from "../../../api/client";

// ─── Request ──────────────────────────────────────────────────────────────────

export type EvaluatePayload = {
    application_id: number;
};

// ─── Shared Sub-types ─────────────────────────────────────────────────────────

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type OfferStatus = "APPROVED" | "CONDITIONAL" | "REJECTED";
export type ReasonType = "RULE" | "RISK" | "SYSTEM";

export type Reason = {
    type: ReasonType;
    message: string;
    impact: ImpactLevel;
};

// ─── Offer ────────────────────────────────────────────────────────────────────

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

// ─── Response ─────────────────────────────────────────────────────────────────

export type EvaluateResponse = {
    bestOffer: Offer | null;
    offers: Offer[];
    error?: string;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const evaluateApi = {
    /**
     * Run all active financing programs against a submitted application.
     * Backend derives customer + vehicle data from the application_id.
     */
    evaluate: async (payload: EvaluatePayload): Promise<EvaluateResponse> => {
        const { data } = await apiClient.post<EvaluateResponse>("/evaluate", payload);
        return data;
    },
};