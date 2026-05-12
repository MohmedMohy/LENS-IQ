// src/admin/applications/routes.ts

import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";
import {
    createApplicationController,
    getApplicationsController,
    updateApplicationStatusController,
} from "./controller.js";

export async function applicationsRoutes(fastify: FastifyInstance) {
    fastify.post(
        "/admin/applications",
        { preHandler: authMiddleware },
        createApplicationController
    );

    fastify.get(
        "/admin/applications",
        { preHandler: authMiddleware },
        getApplicationsController
    );

    fastify.patch<{ Params: { id: string } }>(
        "/admin/applications/:id/status",
        { preHandler: authMiddleware },
        updateApplicationStatusController
    );
}