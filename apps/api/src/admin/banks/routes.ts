import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";
import { rbacMiddleware } from "../../auth/rbac.middleware.js";

import {
    createBankController,
    getBanksController,
    updateBankController,
    deleteBankController,
} from "./controller.js";

const requireWrite = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER")];
const requireRead = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER", "SALES_AGENT")];

export async function banksRoutes(fastify: FastifyInstance) {
    fastify.post("/admin/banks", { preHandler: requireWrite }, createBankController);
    fastify.get("/admin/banks", { preHandler: requireRead }, getBanksController);

    fastify.patch<{ Params: { id: string } }>(
        "/admin/banks/:id",
        { preHandler: requireWrite },
        updateBankController
    );

    fastify.delete<{ Params: { id: string } }>(
        "/admin/banks/:id",
        { preHandler: requireWrite },
        deleteBankController
    );
}
