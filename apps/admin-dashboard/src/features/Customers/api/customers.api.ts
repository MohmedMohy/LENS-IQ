import { apiClient } from "@/api/client";
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from "@/types";

function normalizeCustomer(raw: Record<string, unknown>): Customer {
    return {
        id: Number(raw.id),
        name: String(raw.name),
        national_id: String(raw.national_id),
        phone: String(raw.phone),
        birth_date: String(raw.birth_date ?? ""),
        salary: Number(raw.salary),
        job_type: raw.job_type as Customer["job_type"],
        current_liabilities: Number(raw.current_liabilities ?? 0),
        additional_income: Number(raw.additional_income ?? 0),
        employer_name: raw.employer_name != null ? String(raw.employer_name) : null,
        employment_tenure_months: raw.employment_tenure_months != null
            ? Number(raw.employment_tenure_months)
            : null,
        insurance_number: raw.insurance_number != null ? String(raw.insurance_number) : null,
        club_membership: raw.club_membership != null ? String(raw.club_membership) : null,
        marital_status: raw.marital_status != null
            ? raw.marital_status as Customer["marital_status"]
            : null,
        owns_property: Boolean(raw.owns_property),
        owns_car: Boolean(raw.owns_car),
        salary_transfer: Boolean(raw.salary_transfer),
    };
}

export const customersApi = {
    getAll: async (): Promise<Customer[]> => {
        const { data } = await apiClient.get<{ success: boolean; data: Customer[] }>(
            "/admin/customers"
        );
        return data.data.map(normalizeCustomer);
    },

    getById: async (id: number): Promise<Customer> => {
        const { data } = await apiClient.get<{ success: boolean; data: Customer }>(
            `/admin/customers/${id}`
        );
        return normalizeCustomer(data.data as Record<string, unknown>);
    },

    create: async (payload: CreateCustomerPayload): Promise<Customer> => {
        const { data } = await apiClient.post<{ success: boolean; data: Customer }>(
            "/admin/customers",
            payload
        );
        return normalizeCustomer(data.data as Record<string, unknown>);
    },

    update: async (id: number, payload: UpdateCustomerPayload): Promise<Customer> => {
        const { data } = await apiClient.patch<{ success: boolean; data: Customer }>(
            `/admin/customers/${id}`,
            payload
        );
        return normalizeCustomer(data.data as Record<string, unknown>);
    },

    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/admin/customers/${id}`);
    },
};