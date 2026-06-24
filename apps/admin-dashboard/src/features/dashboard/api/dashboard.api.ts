import { apiClient } from "../../../api/client";
import type { DashboardStats } from "@/types/dashboard";

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get("/dashboard/stats");
        return response.data;
    },
};
