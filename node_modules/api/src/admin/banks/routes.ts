// src/admin/banks/routes.ts

import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";

import {
    createBankController,
    getBanksController,
    updateBankController,
    deleteBankController,
} from "./controller.js";

export async function banksRoutes(fastify: FastifyInstance) {
    fastify.post("/admin/banks", { preHandler: authMiddleware }, createBankController);
    fastify.get("/admin/banks", { preHandler: authMiddleware }, getBanksController);

    fastify.patch<{ Params: { id: string } }>(
        "/admin/banks/:id",
        { preHandler: authMiddleware },
        updateBankController
    );

    fastify.delete<{ Params: { id: string } }>(
        "/admin/banks/:id",
        { preHandler: authMiddleware },
        deleteBankController
    );
}