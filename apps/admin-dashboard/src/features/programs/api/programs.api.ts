import { apiClient } from "@/api/client";
import type { Program, CreateProgramPayload, UpdateProgramPayload } from "@/types";

function normalizeProgram(raw: Record<string, unknown>): Program {
    return {
        id: Number(raw.id),
        name: String(raw.name),
        code: raw.code ? String(raw.code) : null,
        description: raw.description ? String(raw.description) : null,
        customer_types: Array.isArray(raw.customer_types) ? raw.customer_types as Program["customer_types"] : [],
        priority: Number(raw.priority ?? 0),
        required_documents: Array.isArray(raw.required_documents) ? raw.required_documents as string[] : [],

        financing_type: (raw.financing_type as Program["financing_type"]) ?? "conventional",
        calculation_method: (raw.calculation_method as Program["calculation_method"]) ?? "reducing",

        min_salary: Number(raw.min_salary),
        max_customer_age: Number(raw.max_customer_age ?? raw.max_age),
        salary_transfer_required: Boolean(raw.salary_transfer_required),
        max_car_age: Number(raw.max_car_age ?? 0),
        allowed_conditions: (raw.allowed_conditions as Program["allowed_conditions"]) ?? "both",
        max_vehicle_price: raw.max_vehicle_price != null ? Number(raw.max_vehicle_price) : null,

        interest_rate: Number(raw.interest_rate ?? 0),
        profit_rate: raw.profit_rate != null ? Number(raw.profit_rate) : null,

        min_months: Number(raw.min_months ?? 12),
        max_months: Number(raw.max_months),
        min_down_payment_percent: Number(raw.min_down_payment_percent),
        max_down_payment_percent: Number(raw.max_down_payment_percent ?? 100),
        max_finance_amount: raw.max_finance_amount != null ? Number(raw.max_finance_amount) : null,
        admin_fees_percent: Number(raw.admin_fees_percent ?? 0),

        active: Boolean(raw.active),
    };
}

export const programsApi = {
    getAll: async (): Promise<Program[]> => {
        const { data } = await apiClient.get<Program[]>("/admin/programs");
        return data.map(normalizeProgram);
    },

    create: async (payload: CreateProgramPayload): Promise<Program> => {
        const { data } = await apiClient.post<Program>("/admin/programs", payload);
        return normalizeProgram(data as Record<string, unknown>);
    },

    update: async (id: number, payload: UpdateProgramPayload): Promise<Program> => {
        const { data } = await apiClient.patch<Program>(`/admin/programs/${id}`, payload);
        return normalizeProgram(data as Record<string, unknown>);
    },

    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/admin/programs/${id}`);
    },
};
