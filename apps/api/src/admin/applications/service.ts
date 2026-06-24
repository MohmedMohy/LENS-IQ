// src/admin/applications/service.ts

import { db } from "../../db/db.js";
import { decrypt } from "../../shared/crypto.service.js";

export async function createApplication(data: {
    customer_id: number;
    vehicle_id: number;
    requested_down_payment: number;
    requested_months: number;
    payment_method?: string | undefined;
    notes?: string | undefined;
}, tenantId: number) {
    const result = await db.query(
        `INSERT INTO applications
     (tenant_id, customer_id, vehicle_id, requested_down_payment, requested_months, payment_method, notes, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
        [
            tenantId,
            data.customer_id,
            data.vehicle_id,
            data.requested_down_payment,
            data.requested_months,
            data.payment_method ?? "bank_account",
            data.notes ?? null,
        ]
    );
    return result.rows[0];
}

export async function getApplications(tenantId: number) {
    const result = await db.query(
        `SELECT a.*, 
            c.name AS customer_name, c.salary, c.job_type,
            v.brand, v.model, v.price, v.manufacturing_year, v.condition
     FROM applications a
     JOIN customers c ON a.customer_id = c.id
     JOIN vehicles  v ON a.vehicle_id  = v.id
     WHERE a.tenant_id = $1
     ORDER BY a.id DESC`,
        [tenantId]
    );
    return result.rows;
}

export async function getApplicationById(id: number, tenantId: number) {
    const result = await db.query(
        `SELECT a.*, 
            c.name AS customer_name, c.salary, c.job_type, c.national_id, c.phone,
            v.brand, v.model, v.price, v.manufacturing_year, v.condition
     FROM applications a
     JOIN customers c ON a.customer_id = c.id
     JOIN vehicles  v ON a.vehicle_id  = v.id
     WHERE a.id = $1 AND a.tenant_id = $2`,
        [id, tenantId]
    );
    if (!result.rows[0]) throw new Error("Application not found");
    const row = result.rows[0];
    try { if (row.national_id) row.national_id = decrypt(row.national_id); } catch { /* leave plaintext */ }
    try { if (row.phone) row.phone = decrypt(row.phone); } catch { /* leave plaintext */ }
    return row;
}

export async function updateApplicationStatus(
    id: number,
    status: string,
    tenantId: number
) {
    const result = await db.query(
        `UPDATE applications SET status=$1, updated_at=NOW()
     WHERE id=$2 AND tenant_id=$3 RETURNING *`,
        [status, id, tenantId]
    );
    if (!result.rows[0]) throw new Error("Application not found");
    return result.rows[0];
}