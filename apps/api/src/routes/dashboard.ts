import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../auth/auth.middleware.js";
import { db } from "../db/db.js";
import { sendSuccess, sendError } from "../shared/response.js";

export async function dashboardRoutes(fastify: FastifyInstance) {
    fastify.get("/dashboard/stats", { preHandler: [authMiddleware] }, async (req, reply) => {
        try {
            const tenantId = req.tenantId;
            const role = req.tenantRole;
            const userId = req.userId;

            const tenantsResult = await db.query(
                `SELECT name, email FROM tenants WHERE id = $1`,
                [tenantId]
            );
            const tenantInfo = tenantsResult.rows[0];

            const evaluationsResult = await db.query(
                `SELECT COUNT(*)::int as total FROM audit_logs WHERE tenant_id = $1 AND action = 'evaluate'`,
                [tenantId]
            );

            const recentEvaluationsResult = await db.query(
                `SELECT al.created_at, al.entity_id as application_id, u.name as user_name
                 FROM audit_logs al
                 LEFT JOIN users u ON u.id = al.user_id AND u.tenant_id = al.tenant_id
                 WHERE al.tenant_id = $1 AND al.action = 'evaluate'
                 ORDER BY al.created_at DESC
                 LIMIT 5`,
                [tenantId]
            );

            const appsResult = await db.query(
                `SELECT COUNT(*)::int as total,
                        COUNT(*) FILTER (WHERE status = 'APPROVED')::int as approved,
                        COUNT(*) FILTER (WHERE status = 'REJECTED')::int as rejected,
                        COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending,
                        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int as cancelled
                 FROM applications WHERE tenant_id = $1`,
                [tenantId]
            );

            const customersResult = await db.query(
                `SELECT COUNT(*)::int as total FROM customers WHERE tenant_id = $1`,
                [tenantId]
            );

            const vehiclesResult = await db.query(
                `SELECT COUNT(*)::int as total FROM vehicles WHERE tenant_id = $1`,
                [tenantId]
            );

            let teamQuery: string;
            let teamParams: unknown[];
            if (role === "MANAGER" && userId) {
                teamQuery = `SELECT u.id, u.manager_id, u.name, u.email, u.role, u.active, u.created_at,
                                    m.name as manager_name
                             FROM users u
                             LEFT JOIN users m ON m.id = u.manager_id
                             WHERE u.tenant_id = $1 AND (u.manager_id = $2 OR u.id = $2)
                             ORDER BY u.name`;
                teamParams = [tenantId, userId];
            } else {
                teamQuery = `SELECT u.id, u.manager_id, u.name, u.email, u.role, u.active, u.created_at,
                                    m.name as manager_name
                             FROM users u
                             LEFT JOIN users m ON m.id = u.manager_id
                             WHERE u.tenant_id = $1
                             ORDER BY u.name`;
                teamParams = [tenantId];
            }

            const teamResult = await db.query(teamQuery, teamParams);

            const base = {
                applications: appsResult.rows[0],
                customers: customersResult.rows[0].total,
                vehicles: vehiclesResult.rows[0].total,
                evaluations: evaluationsResult.rows[0].total,
                recentEvaluations: recentEvaluationsResult.rows,
                team: teamResult.rows,
                tenant: { name: tenantInfo.name, email: tenantInfo.email, max_users: 7 },
                role,
            };

            return sendSuccess(reply, base);
        } catch (err) {
            return sendError(reply, (err as Error).message || "Failed to fetch dashboard stats", 500);
        }
    });
}
