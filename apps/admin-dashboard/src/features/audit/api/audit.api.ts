import { apiClient } from "../../../api/client";
import type { AuditLog } from "@/types";

type AuditLogsResponse = {
    logs: AuditLog[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
};

export const auditApi = {
    getLogs: async (page = 1): Promise<AuditLogsResponse> => {
        const response = await apiClient.get<AuditLogsResponse>(`/admin/audit-logs?page=${page}`);
        return response.data;
    },
};
