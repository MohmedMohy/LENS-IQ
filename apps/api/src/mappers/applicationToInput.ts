import type { ApplicationInput } from "../shared/types/applicationInput.js";

interface CustomerInfo {
  age?: number;
  salary: number;
  current_liabilities?: number;
  owns_property?: boolean;
  owns_car?: boolean;
  club_membership?: string | null;
  insurance_number?: string | null;
  job_type?: string;
  car_age?: number;
  salary_transfer?: boolean;
}

interface ApplicationInfo {
  id: number;
  requested_down_payment: number;
  requested_months: number;
}

export function mapApplicationToInput(
    app: ApplicationInfo,
    customer: CustomerInfo,
    vehiclePrice: number
): ApplicationInput {
    const currentYear = new Date().getFullYear();

    return {
        id: app.id,
        age: customer.age ?? currentYear,
        salary: customer.salary,
        price: vehiclePrice,
        current_liabilities: customer.current_liabilities ?? 0,
        owns_property: customer.owns_property ?? false,
        owns_car: customer.owns_car ?? false,
        club_membership: customer.club_membership ?? null,
        insurance_number: customer.insurance_number ?? null,
        requestedDownPayment: app.requested_down_payment,
        requestedMonths: app.requested_months,
        job_type: customer.job_type ?? undefined,
        car_age: customer.car_age ?? 0,
        salary_transfer: customer.salary_transfer ?? false,
    };
}
