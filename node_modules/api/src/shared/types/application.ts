export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type PaymentMethod = "salary_transfer" | "bank_account" | "cash_proof";

export interface Application {
    id: number;
    tenant_id: number;
    customer_id: number;
    vehicle_id: number;
    requested_down_payment: number;
    requested_months: number;
    payment_method: PaymentMethod;
    status: ApplicationStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
}