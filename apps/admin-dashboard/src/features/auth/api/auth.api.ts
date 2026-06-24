import { apiClient } from "../../../api/client";
import type { LoginResponse, MeResponse } from "@/types/auth";

export type LoginPayload = {
    email: string;
    password: string;
};

export type { LoginResponse };

export const authApi = {
    login: async (payload: LoginPayload): Promise<LoginResponse> => {
        const response = await apiClient.post("/auth/login", payload);
        return response.data;
    },

    refresh: async (): Promise<LoginResponse> => {
        const response = await apiClient.post("/auth/refresh");
        return response.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.post("/auth/logout");
    },

    me: async (): Promise<MeResponse> => {
        const response = await apiClient.get("/me");
        return response.data;
    },
};
