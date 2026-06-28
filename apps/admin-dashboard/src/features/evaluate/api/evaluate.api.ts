import { apiClient } from "@/api/client";
import type {
    EvaluateRequest,
    EvaluateResponse,
} from "@/types";

export const evaluateApi = {
    evaluate: async (
        payload: EvaluateRequest
    ): Promise<EvaluateResponse> => {
        const { data } = await apiClient.post("/evaluate", payload, { timeout: 120000 });
        return data;
    },
};