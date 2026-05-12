export interface Customer {
    id: number;
    tenant_id: number;
    name: string;
    national_id: string;
    phone: string;
    birth_date: string; // ISO format date string
    salary: number;
    jop_type: "private" | "goverment" | "corporate" | "freelancer" | "retired";
    current_liabilities: number;
    additional_income: number;
    employer_name: string | null;
    employment_tenure_months: number | null;
    insurance_number: string | null;
    club_membership: string | null;
    marital_status: string | null;
    owns_property: boolean;
    owns_car: boolean;
    salary_transfer: boolean;
    created_at: string;
}