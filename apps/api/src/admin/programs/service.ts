import { db } from "../../db/db.js";
import type { CreateProgramDTO, UpdateProgramDTO } from "./programs.schema.js";

export async function createProgram(data: CreateProgramDTO, tenantId: number) {
  const { bank_ids, ...programData } = data;

  const result = await db.query(
    `INSERT INTO programs (
            tenant_id, name, code, description, customer_types, priority, required_documents,
            financing_type, calculation_method,
            min_salary, max_customer_age, salary_transfer_required,
            max_car_age, allowed_conditions, max_vehicle_price,
            interest_rate, profit_rate, min_months, max_months,
            min_down_payment_percent, max_down_payment_percent, max_finance_amount, admin_fees_percent,
            active
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
        ) RETURNING *`,
    [
      tenantId,
      programData.name,
      programData.code ?? null,
      programData.description ?? null,
      programData.customer_types,
      programData.priority ?? 0,
      JSON.stringify(programData.required_documents ?? []),
      programData.financing_type,
      programData.calculation_method,
      programData.min_salary,
      programData.max_customer_age,
      programData.salary_transfer_required,
      programData.max_car_age,
      programData.allowed_conditions,
      programData.max_vehicle_price ?? null,
      programData.interest_rate,
      programData.profit_rate ?? null,
      programData.min_months,
      programData.max_months,
      programData.min_down_payment_percent,
      programData.max_down_payment_percent,
      programData.max_finance_amount ?? null,
      programData.admin_fees_percent,
      programData.active,
    ]
  );
  const program = result.rows[0];

  if (bank_ids && bank_ids.length > 0) {
    const pbValues = bank_ids.map((_, i) => {
      const base = i * 13;
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12},$${base + 13})`;
    }).join(",");
    const pbParams = bank_ids.flatMap(bid => [
      program.id, bid,
      programData.interest_rate, programData.profit_rate ?? null,
      programData.min_months, programData.max_months,
      programData.min_down_payment_percent, programData.max_down_payment_percent,
      programData.max_finance_amount ?? null, programData.admin_fees_percent,
      programData.max_car_age, programData.max_vehicle_price ?? null, true,
    ]);
    await db.query(
      `INSERT INTO program_banks (program_id, bank_id, interest_rate, profit_rate, min_months, max_months, min_down_payment_percent, max_down_payment_percent, max_finance_amount, admin_fees_percent, max_car_age, max_vehicle_price, active)
       VALUES ${pbValues}`,
      pbParams
    );
  }

  return program;
}

export async function getPrograms(tenantId: number) {
  const result = await db.query(
    `SELECT p.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'program_id', pb.program_id,
                        'bank_id', pb.bank_id,
                        'interest_rate', pb.interest_rate,
                        'profit_rate', pb.profit_rate,
                        'min_months', pb.min_months,
                        'max_months', pb.max_months,
                        'min_down_payment_percent', pb.min_down_payment_percent,
                        'max_down_payment_percent', pb.max_down_payment_percent,
                        'max_finance_amount', pb.max_finance_amount,
                        'admin_fees_percent', pb.admin_fees_percent,
                        'max_car_age', pb.max_car_age,
                        'max_vehicle_price', pb.max_vehicle_price,
                        'active', pb.active
                    )
                ) FILTER (WHERE pb.program_id IS NOT NULL),
                '[]'
            ) AS banks
         FROM programs p
         LEFT JOIN program_banks pb ON pb.program_id = p.id
         WHERE p.tenant_id = $1
         GROUP BY p.id
         ORDER BY p.priority ASC, p.id DESC`,
    [tenantId]
  );
  return result.rows;
}

export async function getProgramById(id: number, tenantId: number) {
  const result = await db.query(
    `SELECT p.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'program_id', pb.program_id,
                        'bank_id', pb.bank_id,
                        'interest_rate', pb.interest_rate,
                        'profit_rate', pb.profit_rate,
                        'min_months', pb.min_months,
                        'max_months', pb.max_months,
                        'min_down_payment_percent', pb.min_down_payment_percent,
                        'max_down_payment_percent', pb.max_down_payment_percent,
                        'max_finance_amount', pb.max_finance_amount,
                        'admin_fees_percent', pb.admin_fees_percent,
                        'max_car_age', pb.max_car_age,
                        'max_vehicle_price', pb.max_vehicle_price,
                        'active', pb.active
                    )
                ) FILTER (WHERE pb.program_id IS NOT NULL),
                '[]'
            ) AS banks
         FROM programs p
         LEFT JOIN program_banks pb ON pb.program_id = p.id
         WHERE p.id = $1 AND p.tenant_id = $2
         GROUP BY p.id`,
    [id, tenantId]
  );
  return result.rows[0] ?? null;
}

export async function updateProgram(id: number, data: UpdateProgramDTO, tenantId: number) {
  const { rows } = await db.query(
    `SELECT * FROM programs WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  const p = rows[0];
  if (!p) throw new Error("Program not found");

  const { bank_ids, ...programData } = data;

  const result = await db.query(
    `UPDATE programs SET
            name=COALESCE($1, name),
            code=COALESCE($2, code),
            description=COALESCE($3, description),
            customer_types=COALESCE($4, customer_types),
            priority=COALESCE($5, priority),
            required_documents=COALESCE($6, required_documents::text::jsonb),
            financing_type=COALESCE($7, financing_type),
            calculation_method=COALESCE($8, calculation_method),
            min_salary=COALESCE($9, min_salary),
            max_customer_age=COALESCE($10, max_customer_age),
            salary_transfer_required=COALESCE($11, salary_transfer_required),
            max_car_age=COALESCE($12, max_car_age),
            allowed_conditions=COALESCE($13, allowed_conditions),
            max_vehicle_price=COALESCE($14, max_vehicle_price),
            interest_rate=COALESCE($15, interest_rate),
            profit_rate=COALESCE($16, profit_rate),
            min_months=COALESCE($17, min_months),
            max_months=COALESCE($18, max_months),
            min_down_payment_percent=COALESCE($19, min_down_payment_percent),
            max_down_payment_percent=COALESCE($20, max_down_payment_percent),
            max_finance_amount=COALESCE($21, max_finance_amount),
            admin_fees_percent=COALESCE($22, admin_fees_percent),
            active=COALESCE($23, active)
        WHERE id=$24 AND tenant_id=$25
        RETURNING *`,
    [
      programData.name ?? null, programData.code ?? null, programData.description ?? null,
      programData.customer_types ?? null, programData.priority ?? null,
      programData.required_documents ? JSON.stringify(programData.required_documents) : null,
      programData.financing_type ?? null, programData.calculation_method ?? null,
      programData.min_salary ?? null, programData.max_customer_age ?? null,
      programData.salary_transfer_required ?? null,
      programData.max_car_age ?? null, programData.allowed_conditions ?? null,
      programData.max_vehicle_price ?? null,
      programData.interest_rate ?? null, programData.profit_rate ?? null,
      programData.min_months ?? null, programData.max_months ?? null,
      programData.min_down_payment_percent ?? null, programData.max_down_payment_percent ?? null,
      programData.max_finance_amount ?? null, programData.admin_fees_percent ?? null,
      programData.active ?? null,
      id, tenantId,
    ]
  );

  if (bank_ids !== undefined) {
    await db.query(`DELETE FROM program_banks WHERE program_id = $1`, [id]);
    if (bank_ids.length > 0) {
      const pbValues = bank_ids.map((_, i) => {
        const base = i * 13;
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12},$${base + 13})`;
      }).join(",");
      const pbParams = bank_ids.flatMap(bid => [
        id, bid,
        programData.interest_rate ?? p.interest_rate,
        programData.profit_rate ?? p.profit_rate,
        programData.min_months ?? p.min_months,
        programData.max_months ?? p.max_months,
        programData.min_down_payment_percent ?? p.min_down_payment_percent,
        programData.max_down_payment_percent ?? p.max_down_payment_percent,
        programData.max_finance_amount ?? p.max_finance_amount,
        programData.admin_fees_percent ?? p.admin_fees_percent,
        programData.max_car_age ?? p.max_car_age,
        programData.max_vehicle_price ?? p.max_vehicle_price,
        true,
      ]);
      await db.query(
        `INSERT INTO program_banks (program_id, bank_id, interest_rate, profit_rate, min_months, max_months, min_down_payment_percent, max_down_payment_percent, max_finance_amount, admin_fees_percent, max_car_age, max_vehicle_price, active)
         VALUES ${pbValues}`,
        pbParams
      );
    }
  }

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

export async function getActiveProgramsByCustomerType(tenantId: number, customerType: string) {
  const result = await db.query(
    `SELECT p.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'program_id', pb.program_id,
                        'bank_id', pb.bank_id,
                        'interest_rate', pb.interest_rate,
                        'profit_rate', pb.profit_rate,
                        'min_months', pb.min_months,
                        'max_months', pb.max_months,
                        'min_down_payment_percent', pb.min_down_payment_percent,
                        'max_down_payment_percent', pb.max_down_payment_percent,
                        'max_finance_amount', pb.max_finance_amount,
                        'admin_fees_percent', pb.admin_fees_percent,
                        'max_car_age', pb.max_car_age,
                        'max_vehicle_price', pb.max_vehicle_price,
                        'active', pb.active
                    )
                ) FILTER (WHERE pb.program_id IS NOT NULL),
                '[]'
            ) AS banks
         FROM programs p
         LEFT JOIN program_banks pb ON pb.program_id = p.id
         WHERE p.tenant_id = $1 AND p.active = true
           AND $2 = ANY(p.customer_types)
         GROUP BY p.id
         ORDER BY p.priority ASC, p.id DESC`,
    [tenantId, customerType]
  );
  return result.rows;
}
