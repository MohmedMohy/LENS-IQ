import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";
import { rbacMiddleware } from "../../auth/rbac.middleware.js";
import { getAuditLogsController } from "./controller.js";

export async function auditRoutes(fastify: FastifyInstance) {
    fastify.get(
        "/admin/audit-logs",
        { preHandler: [authMiddleware, rbacMiddleware("ADMIN", "MANAGER")] },
        getAuditLogsController
    );
}
