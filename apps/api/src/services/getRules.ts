import { db } from "../db/db.js";
import type { RuleRow } from "../shared/types/database.js";
import type { Rule, RuleField, RuleOperator, RuleAction } from "../shared/types/rule.js";

export async function getRulesByProgram(
  programId: number,
  tenantId: number
): Promise<Rule[]> {
  const result = await db.query(
    `SELECT * FROM rules WHERE program_id = $1 AND tenant_id = $2 ORDER BY priority ASC, id ASC`,
    [programId, tenantId]
  );

  return result.rows.map((r: RuleRow) => ({
    id: r.id,
    program_id: r.program_id,
    scope: (r.scope || "PROGRAM") as "PROGRAM" | "BANK",
    field: r.field as RuleField,
    operator: r.operator as RuleOperator,
    value: String(r.value),
    action: r.action as RuleAction,
    priority: r.priority || 0,
  }));
}

export async function getRulesByProgramAndScope(
  programId: number,
  scope: string,
  tenantId: number
): Promise<Rule[]> {
  const result = await db.query(
    `SELECT * FROM rules WHERE program_id = $1 AND scope = $2 AND tenant_id = $3 ORDER BY priority ASC, id ASC`,
    [programId, scope, tenantId]
  );

  return result.rows.map((r: RuleRow) => ({
    id: r.id,
    program_id: r.program_id,
    scope: (r.scope || "PROGRAM") as "PROGRAM" | "BANK",
    field: r.field as RuleField,
    operator: r.operator as RuleOperator,
    value: String(r.value),
    action: r.action as RuleAction,
    priority: r.priority || 0,
  }));
}
