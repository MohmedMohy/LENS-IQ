import { db } from "../../db/db.js";
import type { CreateProgramDTO, UpdateProgramDTO } from "./programs.schema.js";

export async function createProgram(data: CreateProgramDTO, tenantId: number) {
  const result = await db.query(
    `INSERT INTO programs (
            tenant_id, bank_id, name,
            financing_type, calculation_method,
            min_salary, max_customer_age, salary_transfer_required,
            max_car_age, allowed_conditions, max_vehicle_price,
            interest_rate, profit_rate, min_months, max_months,
            min_down_payment_percent, max_finance_amount, admin_fees_percent,
            active
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
        ) RETURNING *`,
    [
      tenantId,
      data.bank_id,
      data.name,
      data.financing_type,
      data.calculation_method,
      data.min_salary,
      data.max_customer_age,
      data.salary_transfer_required,
      data.max_car_age,
      data.allowed_conditions,
      data.max_vehicle_price ?? null,
      data.interest_rate,
      data.profit_rate ?? null,
      data.min_months,
      data.max_months,
      data.min_down_payment_percent,
      data.max_finance_amount ?? null,
      data.admin_fees_percent,
      data.active,
    ]
  );
  return result.rows[0];
}

export async function getPrograms(tenantId: number) {
  const result = await db.query(
    `SELECT * FROM programs WHERE tenant_id = $1 ORDER BY id DESC`,
    [tenantId]
  );
  return result.rows;
}

export async function updateProgram(id: number, data: UpdateProgramDTO, tenantId: number) {
  const { rows } = await db.query(
    `SELECT * FROM programs WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  const p = rows[0];
  if (!p) throw new Error("Program not found");

  const result = await db.query(
    `UPDATE programs SET
            bank_id=$1, name=$2,
            financing_type=$3, calculation_method=$4,
            min_salary=$5, max_customer_age=$6, salary_transfer_required=$7,
            max_car_age=$8, allowed_conditions=$9, max_vehicle_price=$10,
            interest_rate=$11, profit_rate=$12, min_months=$13, max_months=$14,
            min_down_payment_percent=$15, max_finance_amount=$16, admin_fees_percent=$17,
            active=$18
        WHERE id=$19 AND tenant_id=$20
        RETURNING *`,
    [
      data.bank_id ?? p.bank_id,
      data.name ?? p.name,
      data.financing_type ?? p.financing_type,
      data.calculation_method ?? p.calculation_method,
      data.min_salary ?? p.min_salary,
      data.max_customer_age ?? p.max_customer_age,
      data.salary_transfer_required ?? p.salary_transfer_required,
      data.max_car_age ?? p.max_car_age,
      data.allowed_conditions ?? p.allowed_conditions,
      data.max_vehicle_price ?? p.max_vehicle_price,
      data.interest_rate ?? p.interest_rate,
      data.profit_rate ?? p.profit_rate,
      data.min_months ?? p.min_months,
      data.max_months ?? p.max_months,
      data.min_down_payment_percent ?? p.min_down_payment_percent,
      data.max_finance_amount ?? p.max_finance_amount,
      data.admin_fees_percent ?? p.admin_fees_percent,
      data.active ?? p.active,
      id,
      tenantId,
    ]
  );
  return result.rows[0];
}

export async function deleteProgram(id: number, tenantId: number) {
  const result = await db.query(
    `DELETE FROM programs WHERE id = $1 AND tenant_id = $2 RETURNING *`,
    [id, tenantId]
  );
  if (!result.rows[0]) throw new Error("Program not found");
  return result.rows[0];
}