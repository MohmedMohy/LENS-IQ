// src/admin/rules/routes.ts

import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";

import {
  createRuleController,
  getRulesController,
  updateRuleController,
  deleteRuleController,
} from "./controller.js";

export async function rulesRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/admin/rules",
    { preHandler: authMiddleware },
    createRuleController
  );

  fastify.get<{ Params: { programId: string } }>(
    "/admin/rules/:programId",
    { preHandler: authMiddleware },
    getRulesController
  );

  fastify.patch<{ Params: { id: string } }>(
    "/admin/rules/:id",
    { preHandler: authMiddleware },
    updateRuleController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/admin/rules/:id",
    { preHandler: authMiddleware },
    deleteRuleController
  );
}