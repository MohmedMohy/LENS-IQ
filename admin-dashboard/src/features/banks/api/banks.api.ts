import { apiClient } from "../../../api/client";
import type { Bank, CreateBankPayload, UpdateBankPayload } from "@/types";

function normalizeBank(raw: Bank): Bank {
    return {
        id: Number(raw.id),
        name: raw.name,
        code: raw.code,
        logo_url: raw.logo_url ?? null,
        active: Boolean(raw.active),
    };
}

export const banksApi = {
    getAll: async (): Promise<Bank[]> => {
        const response = await apiClient.get<Bank[]>("/admin/banks");
        return response.data.map(normalizeBank);
    },

    create: async (payload: CreateBankPayload): Promise<Bank> => {
        const response = await apiClient.post<Bank>("/admin/banks", payload);
        return normalizeBank(response.data);
    },

    update: async (id: number, payload: UpdateBankPayload): Promise<Bank> => {
        const response = await apiClient.patch<Bank>(`/admin/banks/${id}`, payload);
        return normalizeBank(response.data);
    },

    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/admin/banks/${id}`);
    },
};