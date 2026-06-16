// src/api/profile.api.ts

import { apiClient } from "../../../api/client";
import type { Tenant } from "@/types/auth";

export type UpdateProfilePayload = {
    name: string;
};

export type ChangePasswordPayload = {
    current_password: string;
    new_password: string;
};

export const profileApi = {
    get: async (): Promise<Tenant & { api_key: string }> => {
        const response = await apiClient.get("/auth/profile");
        return response.data;
    },

    updateName: async (payload: UpdateProfilePayload): Promise<Tenant & { api_key: string }> => {
        const response = await apiClient.patch("/auth/profile", payload);
        return response.data;
    },

    changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean }> => {
        const response = await apiClient.patch("/auth/password", payload);
        return response.data;
    },

    regenerateApiKey: async (): Promise<Tenant & { api_key: string }> => {
        const response = await apiClient.post("/auth/regenerate-key");
        return response.data;
    },
};