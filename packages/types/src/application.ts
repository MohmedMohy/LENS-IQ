export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "UNDER_REVIEW";

export type PaymentMethod = "salary_transfer" | "bank_account" | "cash_proof";

export type JobType = "private" | "government" | "corporate" | "freelancer" | "retired";

export type VehicleCondition = "new" | "used";

export interface Application {
  id: number;
  customer_id: number;
  vehicle_id: number;
  requested_down_payment: number;
  requested_months: number;
  payment_method: PaymentMethod;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string;
  salary: number;
  job_type: JobType;
  brand: string;
  model: string;
  price: number;
  manufacturing_year: number;
  condition: VehicleCondition;
}

export interface CreateApplicationPayload {
  customer_id: number;
  vehicle_id: number;
  requested_down_payment: number;
  requested_months: number;
  payment_method?: PaymentMethod;
  notes?: string;
}

export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus;
}
