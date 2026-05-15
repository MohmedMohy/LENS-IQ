import { apiClient } from "@/api/client";
import type {
    EvaluateRequest,
    EvaluateResponse,
} from "./../../../../../packages/shared/types/src/evaluate";

export const evaluateApi = {
    evaluate: async (
        payload: EvaluateRequest
    ): Promise<EvaluateResponse> => {
        const { data } =
            await apiClient.post(
                "/evaluate",
                payload
            );

        return data;
    },
};