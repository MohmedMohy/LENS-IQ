import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";
import { rbacMiddleware } from "../../auth/rbac.middleware.js";
import {
    createApplicationController,
    getApplicationsController,
    getApplicationByIdController,
    updateApplicationStatusController,
} from "./controller.js";

const requireWrite = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER")];
const requireRead = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER", "SALES_AGENT")];
const requireStatusUpdate = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER", "SALES_AGENT")];

export async function applicationsRoutes(fastify: FastifyInstance) {
    fastify.post(
        "/admin/applications",
        { preHandler: requireWrite },
        createApplicationController
    );

    fastify.get(
        "/admin/applications",
        { preHandler: requireRead },
        getApplicationsController
    );

    fastify.get<{ Params: { id: string } }>(
        "/admin/applications/:id",
        { preHandler: requireRead },
        getApplicationByIdController
    );

    fastify.patch<{ Params: { id: string } }>(
        "/admin/applications/:id/status",
        { preHandler: requireStatusUpdate },
        updateApplicationStatusController
    );
}
