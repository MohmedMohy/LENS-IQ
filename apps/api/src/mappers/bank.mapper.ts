// src/mappers/bank.mapper.ts

import type { Bank } from "../shared/types/bank.js";

export function mapBank(row: any): Bank {
    return {
        id: Number(row.id),

        tenantId: Number(row.tenant_id),

        name: row.name,

        code: row.code,

        logoUrl: row.logo_url ?? null,

        active: Boolean(row.active),

        createdAt: row.created_at,
    };
}