// src/services/getApplication.ts

import { db } from "../db/db.js";
import type { ApplicationInput } from "../shared/types/input.js";

export async function getApplicationById(
  id: number,
  tenantId: number
): Promise<ApplicationInput> {
  const result = await db.query(
    `SELECT 
      a.id AS application_id,
      c.age,
      c.salary,
      c.current_liabilities,
      c.owns_property,
      c.owns_car,
      c.club_membership,
      c.insurance_number,
      v.price
     FROM applications a
     JOIN customers c ON a.customer_id = c.id
     JOIN vehicles v  ON a.vehicle_id  = v.id
     WHERE a.id = $1 AND a.tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) throw new Error("Application not found");

  const row = result.rows[0];

  return {
    id: row.application_id,
    age: Number(row.age),
    salary: Number(row.salary),
    current_liabilities: Number(row.current_liabilities || 0),
    price: Number(row.price),
    owns_property: row.owns_property ?? false,
    owns_car: row.owns_car ?? false,
    club_membership: row.club_membership ?? null,
    insurance_number: row.insurance_number ?? null,
  };
}