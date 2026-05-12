export interface CustomerDTO {
    age: number;
    salary: number;
    current_liabilities: number;

    owns_property: boolean;
    owns_car: boolean;

    club_membership: string | null;
    insurance_number: string | null;
}