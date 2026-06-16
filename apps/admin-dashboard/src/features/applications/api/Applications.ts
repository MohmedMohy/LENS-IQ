// src/api/applications.api.ts

import { apiClient } from "./../../../api/client";
import type { Application, CreateApplicationPayload } from "@/types";

export const applicationsApi = {
    getAll: async (): Promise<Application[]> => {
        const response = await apiClient.get<{ success: boolean; data: Application[] }>(
            "/admin/applications"
        );
        return response.data.data;
    },

    create: async (payload: CreateApplicationPayload): Promise<Application> => {
        const response = await apiClient.post<{ success: boolean; data: Application }>(
            "/admin/applications",
            payload
        );
        return response.data.data;
    },

    updateStatus: async (
        id: number,
        status: string
    ): Promise<Application> => {
        const response = await apiClient.patch<{ success: boolean; data: Application }>(
            `/admin/applications/${id}/status`,
            { status }
        );
        return response.data.data;
    },
};