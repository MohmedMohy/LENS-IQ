// src/services/getPrograms.ts

import { db } from "../db/db.js";

import type { Program } from "../shared/types/program.js";

import { mapProgram } from "../mappers/program.mapper.js";

export async function getPrograms(
  tenantId: number
): Promise<Program[]> {

  const result = await db.query(
    `
    SELECT *
    FROM programs
    WHERE active = true
      AND tenant_id = $1
    ORDER BY id DESC
    `,
    [tenantId]
  );

  return result.rows.map(mapProgram);
}