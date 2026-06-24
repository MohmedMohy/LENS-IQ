import { db } from "../../db/db.js";
import { encrypt, decrypt } from "../../shared/crypto.service.js";
import type { CreateCustomerDTO, UpdateCustomerDTO } from "./customers.schema.js";

function decryptCustomer(row: any) {
    if (!row) return row;
    try {
        if (row.national_id) row.national_id = decrypt(row.national_id);
        if (row.phone) row.phone = decrypt(row.phone);
    } catch {
        // leave as-is if not encrypted (e.g., existing plaintext data during migration)
    }
    return row;
}

function decryptCustomers(rows: any[]) {
    return rows.map(decryptCustomer);
}

export async function createCustomer(data: CreateCustomerDTO, tenantId: number) {
    const national_id = encrypt(data.national_id);
    const phone = encrypt(data.phone);

    const result = await db.query(
        `INSERT INTO customers (
      tenant_id, name, national_id, phone, birth_date,
      salary, job_type, current_liabilities, additional_income,
      employer_name, employment_tenure_months, insurance_number,
      club_membership, marital_status, owns_property, owns_car, salary_transfer,
      tax_card, commercial_registry
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    RETURNING *`,
        [
            tenantId, data.name, national_id, phone, data.birth_date,
            data.salary, data.job_type, data.current_liabilities, data.additional_income,
            data.employer_name ?? null, data.employment_tenure_months ?? null,
            data.insurance_number ?? null, data.club_membership ?? null,
            data.marital_status ?? null, data.owns_property, data.owns_car, data.salary_transfer,
            data.tax_card ?? null, data.commercial_registry ?? null,
        ]
    );
    return decryptCustomer(result.rows[0]);
}

export async function getCustomers(tenantId: number) {
    const result = await db.query(
        `SELECT * FROM customers WHERE tenant_id = $1 ORDER BY id DESC`,
        [tenantId]
    );
    return decryptCustomers(result.rows);
}

export async function getCustomerById(id: number, tenantId: number) {
    const result = await db.query(
        `SELECT * FROM customers WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
    );
    if (!result.rows[0]) throw new Error("Customer not found");
    return decryptCustomer(result.rows[0]);
}

export async function updateCustomer(id: number, data: UpdateCustomerDTO, tenantId: number) {
    const existing = await getCustomerById(id, tenantId);

    const national_id = data.national_id !== undefined ? encrypt(data.national_id) : encrypt(existing.national_id);
    const phone = data.phone !== undefined ? encrypt(data.phone) : encrypt(existing.phone);

    const result = await db.query(
        `UPDATE customers SET
      name=$1, national_id=$2, phone=$3, birth_date=$4,
      salary=$5, job_type=$6, current_liabilities=$7, additional_income=$8,
      employer_name=$9, employment_tenure_months=$10, insurance_number=$11,
      club_membership=$12, marital_status=$13, owns_property=$14,
      owns_car=$15, salary_transfer=$16, tax_card=$17, commercial_registry=$18
    WHERE id=$19 AND tenant_id=$20 RETURNING *`,
        [
            data.name ?? existing.name,
            national_id,
            phone,
            data.birth_date ?? existing.birth_date,
            data.salary ?? existing.salary,
            data.job_type ?? existing.job_type,
            data.current_liabilities ?? existing.current_liabilities,
            data.additional_income ?? existing.additional_income,
            data.employer_name ?? existing.employer_name,
            data.employment_tenure_months ?? existing.employment_tenure_months,
            data.insurance_number ?? existing.insurance_number,
            data.club_membership ?? existing.club_membership,
            data.marital_status ?? existing.marital_status,
            data.owns_property ?? existing.owns_property,
            data.owns_car ?? existing.owns_car,
            data.salary_transfer ?? existing.salary_transfer,
            data.tax_card ?? existing.tax_card,
            data.commercial_registry ?? existing.commercial_registry,
            id, tenantId,
        ]
    );
    return decryptCustomer(result.rows[0]);
}

export async function deleteCustomer(id: number, tenantId: number) {
    const result = await db.query(
        `DELETE FROM customers WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [id, tenantId]
    );
    if (!result.rows[0]) throw new Error("Customer not found");
    return decryptCustomer(result.rows[0]);
}
