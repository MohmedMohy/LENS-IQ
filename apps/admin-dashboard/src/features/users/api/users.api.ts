import { apiClient } from "../../../api/client";
import type { User, CreateUserPayload, UpdateUserPayload } from "@/types";

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

export const usersApi = {
    getAll: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>("/admin/users");
        return response.data.map(normalizeUser);
    },

    create: async (payload: CreateUserPayload): Promise<User> => {
        const response = await apiClient.post<User>("/admin/users", payload);
        return normalizeUser(response.data);
    },

    update: async (id: number, payload: UpdateUserPayload): Promise<User> => {
        const response = await apiClient.patch<User>(`/admin/users/${id}`, payload);
        return normalizeUser(response.data);
    },

    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/admin/users/${id}`);
    },

};
