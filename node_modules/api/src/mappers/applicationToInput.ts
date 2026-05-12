import type { Application } from "../shared/types/application.js";
import type { ApplicationInput } from "../shared/types/applicationInput.js";

export function mapApplicationToInput(
    app: Application,
    customer: any // (هنفترض customer data جاية من service)
): ApplicationInput {

    return {
        id: app.id,

        age: customer.age,
        salary: customer.salary,

        price: app.vehicle_id, // (هتتبدل لاحقًا بـ vehicle price)

        current_liabilities: customer.current_liabilities,

        owns_property: customer.owns_property,
        owns_car: customer.owns_car,

        club_membership: customer.club_membership,
        insurance_number: customer.insurance_number,
    };
}