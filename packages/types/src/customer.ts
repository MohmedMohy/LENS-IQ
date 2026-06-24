export type JobType = "private" | "government" | "corporate" | "freelancer" | "retired";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export interface Customer {
  id: number;
  name: string;
  national_id: string;
  phone: string;
  birth_date: string;
  salary: number;
  job_type: JobType;
  current_liabilities: number;
  additional_income: number;
  employer_name: string | null;
  employment_tenure_months: number | null;
  insurance_number: string | null;
  club_membership: string | null;
  marital_status: MaritalStatus | null;
  owns_property: boolean;
  owns_car: boolean;
  salary_transfer: boolean;
  tax_card: string | null;
  commercial_registry: string | null;
}

export type CreateCustomerPayload = Omit<Customer, "id">;
export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;
