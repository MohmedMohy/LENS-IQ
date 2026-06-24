import { db } from "../db/db.js";

export interface AuditEntry {
    tenantId: number;
    userId?: number;
    userType?: string;
    action: string;
    entity: string;
    entityId?: number;
    details?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
    try {
        await db.query(
            `INSERT INTO audit_logs (tenant_id, user_id, user_type, action, entity, entity_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                entry.tenantId,
                entry.userId ?? null,
                entry.userType ?? "tenant",
                entry.action,
                entry.entity,
                entry.entityId ?? null,
                entry.details ? JSON.stringify(entry.details) : null,
                null,
            ]
        );
    } catch (err) {
        console.error("Failed to write audit log:", err);
    }
}
