import { apiClient } from "./../../../api/client";
import type { Application, CreateApplicationPayload } from "@/types";

export const applicationsApi = {
    getAll: async (): Promise<Application[]> => {
        const { data } = await apiClient.get<Application[]>("/admin/applications");
        return data;
    },

    create: async (payload: CreateApplicationPayload): Promise<Application> => {
        const { data } = await apiClient.post<Application>("/admin/applications", payload);
        return data;
    },

    updateStatus: async (id: number, status: string): Promise<Application> => {
        const { data } = await apiClient.patch<Application>(`/admin/applications/${id}/status`, { status });
        return data;
    },
};
