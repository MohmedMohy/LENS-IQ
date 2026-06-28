export interface ApplicationInput {
    id: number;
    age: number;
    salary: number;
    price: number;
    current_liabilities: number;
    owns_property: boolean;
    owns_car: boolean;
    club_membership: string | null;
    insurance_number: string | null;
    requestedDownPayment: number;
    job_type?: string;
    car_age?: number;
    salary_transfer?: boolean;
    iScore?: number;
    carYear?: number;
    vehicleCondition?: 'new' | 'used';
}
