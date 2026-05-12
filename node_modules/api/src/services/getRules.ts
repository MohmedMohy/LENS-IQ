// src/services/getRules.ts

import { db } from "../db/db.js";

export async function getRulesByProgram(
  programId: number,
  tenantId: number
) {
  const result = await db.query(
    `
      SELECT *
      FROM rules
      WHERE program_id = $1
      AND tenant_id = $2
    `,
    [programId, tenantId]
  );

  return result.rows.map((r) => ({
    id: r.id,

    program_id: r.program_id,

    field: r.field,

    operator: r.operator,

    value: String(r.value),

    action: r.action,
  }));
}