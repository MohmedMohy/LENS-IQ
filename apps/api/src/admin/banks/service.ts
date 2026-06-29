import { db } from "../../db/db.js";
import type { CreateBankDTO, UpdateBankDTO } from "./banks.schema.js";

export async function createBank(data: CreateBankDTO, tenantId: number) {
    const result = await db.query(
        `INSERT INTO banks (tenant_id, name, code, logo_url, active)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
        [tenantId, data.name, data.code, data.logo_url ?? null, data.active]
    );
    return result.rows[0];
}

export async function getBanks(tenantId: number) {
    const result = await db.query(
        `SELECT b.*,
            COALESCE(
                (SELECT json_agg(DISTINCT pb.program_id) FROM program_banks pb WHERE pb.bank_id = b.id),
                '[]'::json
            ) AS supported_program_ids
         FROM banks b
         WHERE b.tenant_id = $1
         ORDER BY b.id DESC`,
        [tenantId]
    );
    return result.rows;
}

export async function updateBank(id: number, data: UpdateBankDTO, tenantId: number) {
    const existing = await db.query(
        `SELECT * FROM banks WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
    );
    const b = existing.rows[0];
    if (!b) throw new Error("Bank not found");

    const result = await db.query(
        `UPDATE banks
     SET name=$1, code=$2, logo_url=$3, active=$4
     WHERE id=$5 AND tenant_id=$6
     RETURNING *`,
        [
            data.name ?? b.name,
            data.code ?? b.code,
            data.logo_url ?? b.logo_url,
            data.active ?? b.active,
            id,
            tenantId,
        ]
    );
    return result.rows[0];
}

export async function deleteBank(id: number, tenantId: number) {
    const result = await db.query(
        `DELETE FROM banks
     WHERE id = $1 AND tenant_id = $2
     RETURNING *`,
        [id, tenantId]
    );
    if (!result.rows[0]) throw new Error("Bank not found");
    return result.rows[0];
}
