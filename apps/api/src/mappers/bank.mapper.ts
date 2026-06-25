import type { Bank } from "../shared/types/bank.js";
import type { BankRow } from "../shared/types/database.js";

export function mapBank(row: BankRow): Bank {
    return {
        id: Number(row.id),
        tenantId: Number(row.tenant_id),
        name: row.name,
        code: row.code,
        logoUrl: row.logo_url ?? null,
        active: Boolean(row.active),
    };
}
