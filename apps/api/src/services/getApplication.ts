import { db } from "../db/db.js";
import type { ApplicationInput } from "../shared/types/applicationInput.js";

export async function getApplicationById(
  id: number,
  tenantId: number
): Promise<ApplicationInput> {
  const result = await db.query(
    `SELECT 
      a.id AS application_id,
      a.requested_down_payment,
      c.birth_date,
      c.salary,
      c.current_liabilities,
      c.owns_property,
      c.owns_car,
      c.club_membership,
      c.insurance_number,
      c.job_type,
      c.salary_transfer,
      v.price,
      v.manufacturing_year
     FROM applications a
     JOIN customers c ON a.customer_id = c.id
     JOIN vehicles v  ON a.vehicle_id  = v.id
     WHERE a.id = $1 AND a.tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) throw new Error("Application not found");

  const row = result.rows[0];
  const currentYear = new Date().getFullYear();

  return {
    id: row.application_id,
    age: currentYear - new Date(row.birth_date).getFullYear(),
    salary: Number(row.salary),
    price: Number(row.price),
    current_liabilities: Number(row.current_liabilities || 0),
    owns_property: row.owns_property ?? false,
    owns_car: row.owns_car ?? false,
    club_membership: row.club_membership ?? null,
    insurance_number: row.insurance_number ?? null,
    requestedDownPayment: Number(row.requested_down_payment || 0),
    job_type: row.job_type ?? undefined,
    car_age: currentYear - Number(row.manufacturing_year || currentYear),
    salary_transfer: row.salary_transfer ?? false,
  };
}
