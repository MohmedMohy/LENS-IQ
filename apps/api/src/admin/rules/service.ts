import { db } from "../../db/db.js";
import type { CreateRuleDTO, UpdateRuleDTO } from "./schema.js";

export async function createRule(data: CreateRuleDTO, tenantId: number) {
  const result = await db.query(
    `INSERT INTO rules (tenant_id, program_id, scope, field, operator, value, action, priority)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      tenantId,
      data.program_id,
      data.scope ?? "PROGRAM",
      data.field,
      data.operator,
      data.value,
      data.action,
      data.priority ?? 0,
    ]
  );
  return result.rows[0];
}

export async function getRules(programId: number, tenantId: number) {
  const result = await db.query(
    `SELECT * FROM rules
     WHERE program_id = $1 AND tenant_id = $2
     ORDER BY priority ASC, id ASC`,
    [programId, tenantId]
  );
  return result.rows;
}

export async function getRulesByScope(programId: number, scope: string, tenantId: number) {
  const result = await db.query(
    `SELECT * FROM rules
     WHERE program_id = $1 AND scope = $2 AND tenant_id = $3
     ORDER BY priority ASC, id ASC`,
    [programId, scope, tenantId]
  );
  return result.rows;
}

export async function updateRule(id: number, data: UpdateRuleDTO, tenantId: number) {
  const existing = await db.query(
    `SELECT * FROM rules WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  const r = existing.rows[0];
  if (!r) throw new Error("Rule not found");

  const result = await db.query(
    `UPDATE rules
     SET program_id=$1, scope=$2, field=$3, operator=$4, value=$5, action=$6, priority=$7
     WHERE id=$8 AND tenant_id=$9
     RETURNING *`,
    [
      data.program_id ?? r.program_id,
      data.scope ?? r.scope,
      data.field ?? r.field,
      data.operator ?? r.operator,
      data.value ?? r.value,
      data.action ?? r.action,
      data.priority ?? r.priority,
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
