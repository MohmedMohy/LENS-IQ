import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";
import { rbacMiddleware } from "../../auth/rbac.middleware.js";

import {
  createProgramController,
  getProgramsController,
  updateProgramController,
  deleteProgramController,
} from "./controller.js";

const requireWrite = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER")];
const requireRead = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER", "SALES_AGENT")];

export async function programsRoutes(fastify: FastifyInstance) {
  fastify.post("/admin/programs", { preHandler: requireWrite }, createProgramController);
  fastify.get("/admin/programs", { preHandler: requireRead }, getProgramsController);

  fastify.patch<{ Params: { id: string } }>(
    "/admin/programs/:id",
    { preHandler: requireWrite },
    updateProgramController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/admin/programs/:id",
    { preHandler: requireWrite },
    deleteProgramController
  );
}
