import { apiClient } from "../../../api/client";
import type { User } from "@/types";

function normalizeUser(raw: User): User {
    return {
        id: Number(raw.id),
        tenant_id: Number(raw.tenant_id),
        manager_id: raw.manager_id ? Number(raw.manager_id) : null,
        name: raw.name,
        email: raw.email,
        role: raw.role,
        active: Boolean(raw.active),
        created_at: raw.created_at,
        manager_name: raw.manager_name || null,
    };
}

export const teamApi = {
    getMembers: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>("/admin/team");
        return response.data.map(normalizeUser);
    },

    updateMember: async (id: number, payload: { name?: string; email?: string; password?: string; active?: boolean }): Promise<User> => {
        const response = await apiClient.patch<User>(`/admin/team/${id}`, payload);
        return normalizeUser(response.data);
    },
};
