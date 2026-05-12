export type EvaluateInput = {
    age: number;
    salary: number;
    price: number;
    current_liabilities: number;
    requested_down_payment: number;
    job_type: string;
    car_age: number;
    owns_property: boolean;
    owns_car: boolean;
    salary_transfer: boolean;
    club_membership?: string | null;
    insurance_number?: string | null;
};