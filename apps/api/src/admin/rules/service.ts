import { db } from "../../db/db.js";
import type { CreateRuleDTO, UpdateRuleDTO } from "./schema.js";

export async function createRule(data: CreateRuleDTO, tenantId: number) {
  const result = await db.query(
    `INSERT INTO rules (tenant_id, program_id, field, operator, value, action)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      tenantId,
      data.program_id,
      data.field,
      data.operator,
      data.value,
      data.action,
    ]
  );

  return result.rows[0];
}

export async function getRules(programId: number, tenantId: number) {
  const result = await db.query(
    `SELECT * FROM rules 
     WHERE program_id = $1 AND tenant_id = $2`,
    [programId, tenantId]
  );

  return result.rows;
}

export async function updateRule(
  id: number,
  data: UpdateRuleDTO,
  tenantId: number
) {
  const existing = await db.query(
    `SELECT * FROM rules WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  const r = existing.rows[0];
  if (!r) throw new Error("Rule not found");

  const result = await db.query(
    `UPDATE rules
     SET program_id=$1, field=$2, operator=$3, value=$4, action=$5
     WHERE id=$6 AND tenant_id=$7
     RETURNING *`,
    [
      data.program_id ?? r.program_id,
      data.field ?? r.field,
      data.operator ?? r.operator,
      data.value ?? r.value,
      data.action ?? r.action,
      id,
      tenantId,
    ]
  );

  return result.rows[0];
}

export async function deleteRule(id: number, tenantId: number) {
  const result = await db.query(
    `DELETE FROM rules 
     WHERE id = $1 AND tenant_id = $2 
     RETURNING *`,
    [id, tenantId]
  );

  if (!result.rows[0]) throw new Error("Rule not found");
  return result.rows[0];
}
