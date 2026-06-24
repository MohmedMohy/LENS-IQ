import type { Application } from "../shared/types/application.js";
import type { ApplicationInput } from "../shared/types/applicationInput.js";

export function mapApplicationToInput(
    app: Application,
    customer: any,
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
        job_type: customer.job_type ?? undefined,
        car_age: customer.car_age ?? 0,
        salary_transfer: customer.salary_transfer ?? false,
    };
}
