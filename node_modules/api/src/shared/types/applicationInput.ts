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
    requestedDownPayment?: number;
}