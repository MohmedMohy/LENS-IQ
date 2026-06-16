import axios from "axios";
import { ENV } from "@/config/env";

const publicClient = axios.create({
    baseURL: ENV.API_URL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

export type PublicVehicle = {
    id: number;
    brand: string;
    model: string;
    manufacturing_year: number;
    condition: "new" | "used";
    price: number;
    category: string | null;
};

export type ApplyPayload = {
    dealer_code: string;
    vehicle_id: number;
    requested_down_payment: number;
    requested_months: number;
    payment_method: "salary_transfer" | "bank_account" | "cash_proof";
    notes?: string;
    customer: {
        name: string;
        national_id: string;
        phone: string;
        birth_date: string;
        salary: number;
        job_type: "private" | "government" | "corporate" | "freelancer" | "retired";
        current_liabilities: number;
        additional_income: number;
        employer_name?: string;
        employment_tenure_months?: number;
        marital_status?: "single" | "married" | "divorced" | "widowed";
        owns_property: boolean;
        owns_car: boolean;
        salary_transfer: boolean;
        insurance_number?: string;
        club_membership?: string;
    };
};

export type ApplyResponse = {
    success: boolean;
    application_id: number;
    message: string;
};

export const publicApi = {
    getVehicles: async (code: string): Promise<PublicVehicle[]> => {
        const { data } = await publicClient.get(`/public/vehicles/${code}`);
        return data.vehicles;
    },

    apply: async (payload: ApplyPayload): Promise<ApplyResponse> => {
        const { data } = await publicClient.post("/public/apply", payload);
        return data;
    },
};