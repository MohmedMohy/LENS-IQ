import { db } from "../../db/db.js";

const PAGE_SIZE = 50;

export async function getAuditLogs(tenantId: number, page = 1, role?: string, userId?: number) {
    const offset = (page - 1) * PAGE_SIZE;

    const conditions: string[] = ["al.tenant_id = $1"];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (role === "MANAGER" && userId) {
        conditions.push(`al.user_type != 'tenant'`);

        conditions.push(`(al.user_id IN (
            SELECT id FROM users WHERE tenant_id = $1 AND manager_id = $${paramIndex}
        ) OR al.user_id = $${paramIndex})`);
        params.push(userId);
        paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    const countResult = await db.query(
        `SELECT COUNT(*)::int as total FROM audit_logs al WHERE ${whereClause}`,
        params
    );
    const total = countResult.rows[0].total;

    const result = await db.query(
        `SELECT
            al.id,
            al.tenant_id,
            al.user_id,
            al.user_type,
            al.action,
            al.entity,
            al.entity_id,
            al.details,
            al.ip_address,
            al.created_at,
            u.name AS user_name,
            u.email AS user_email
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id AND u.tenant_id = al.tenant_id
         WHERE ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, PAGE_SIZE, offset]
    );

    return {
        logs: result.rows,
        pagination: {
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages: Math.ceil(total / PAGE_SIZE),
        },
    };
}
