import { apiClient } from "../../../api/client";

export type EvaluatePayload = {
    age: number;
    salary: number;
    price: number;
    current_liabilities: number;
    requested_down_payment: number;
};

export type Reason = {
    type: "RULE" | "RISK" | "SYSTEM";
    message: string;
    impact: "LOW" | "MEDIUM" | "HIGH";
};

export type Offer = {
    programId: number;
    bankId: number;
    status: "APPROVED" | "CONDITIONAL" | "REJECTED";
    installment: number;
    totalPayment: number;
    interestRate: number;
    months: number;
    dti: number;
    riskScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    affordabilityScore: number;
    reasons?: Reason[];
};

export type EvaluateResponse = {
    bestOffer: Offer | null;
    offers: Offer[];
    error?: string;
};

export const evaluateApi = {
    calculate: async (payload: EvaluatePayload): Promise<EvaluateResponse> => {
        const response = await apiClient.post<EvaluateResponse>("/evaluate", payload);
        return response.data;
    },
};