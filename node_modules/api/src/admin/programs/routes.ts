// src/admin/programs/routes.ts

import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";

import {
  createProgramController,
  getProgramsController,
  updateProgramController,
  deleteProgramController,
} from "./controller.js";

export async function programsRoutes(fastify: FastifyInstance) {
  fastify.post("/admin/programs", { preHandler: authMiddleware }, createProgramController);
  fastify.get("/admin/programs", { preHandler: authMiddleware }, getProgramsController);

  fastify.patch<{ Params: { id: string } }>(   // ✅ Generic هنا
    "/admin/programs/:id",
    { preHandler: authMiddleware },
    updateProgramController
  );

  fastify.delete<{ Params: { id: string } }>(  // ✅ Generic هنا
    "/admin/programs/:id",
    { preHandler: authMiddleware },
    deleteProgramController
  );
}