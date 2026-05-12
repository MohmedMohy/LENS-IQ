import { db } from "../../db/db.js";
import type { CreateVehicleDTO, UpdateVehicleDTO } from "./vehicles.schema.js";

export async function createVehicle(data: CreateVehicleDTO, tenantId: number) {
    const result = await db.query(
        `INSERT INTO vehicles (tenant_id, brand, model, manufacturing_year, condition, price, category)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenantId, data.brand, data.model, data.manufacturing_year, data.condition, data.price, data.category ?? null]
    );
    return result.rows[0];
}

export async function getVehicles(tenantId: number) {
    const result = await db.query(
        `SELECT * FROM vehicles WHERE tenant_id = $1 ORDER BY id DESC`,
        [tenantId]
    );
    return result.rows;
}

export async function getVehicleById(id: number, tenantId: number) {
    const result = await db.query(
        `SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
    );
    if (!result.rows[0]) throw new Error("Vehicle not found");
    return result.rows[0];
}

export async function updateVehicle(id: number, data: UpdateVehicleDTO, tenantId: number) {
    const v = await getVehicleById(id, tenantId);
    const result = await db.query(
        `UPDATE vehicles SET brand=$1, model=$2, manufacturing_year=$3,
     condition=$4, price=$5, category=$6
     WHERE id=$7 AND tenant_id=$8 RETURNING *`,
        [
            data.brand ?? v.brand,
            data.model ?? v.model,
            data.manufacturing_year ?? v.manufacturing_year,
            data.condition ?? v.condition,
            data.price ?? v.price,
            data.category ?? v.category,
            id, tenantId,
        ]
    );
    return result.rows[0];
}

export async function deleteVehicle(id: number, tenantId: number) {
    const result = await db.query(
        `DELETE FROM vehicles WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [id, tenantId]
    );
    if (!result.rows[0]) throw new Error("Vehicle not found");
    return result.rows[0];
}