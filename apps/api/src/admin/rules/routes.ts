import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";
import { rbacMiddleware } from "../../auth/rbac.middleware.js";

import {
  createRuleController,
  getRulesController,
  updateRuleController,
  deleteRuleController,
} from "./controller.js";

const requireWrite = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER")];
const requireRead = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER", "SALES_AGENT")];

export async function rulesRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/admin/rules",
    { preHandler: requireWrite },
    createRuleController
  );

  fastify.get<{ Params: { programId: string } }>(
    "/admin/rules/:programId",
    { preHandler: requireRead },
    getRulesController
  );

  fastify.patch<{ Params: { id: string } }>(
    "/admin/rules/:id",
    { preHandler: requireWrite },
    updateRuleController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/admin/rules/:id",
    { preHandler: requireWrite },
    deleteRuleController
  );
}
