import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../auth/auth.middleware.js";
import { rbacMiddleware } from "../../auth/rbac.middleware.js";
import {
    createUserController,
    getUsersController,
    getUserController,
    updateUserController,
    deleteUserController,
    getTeamController,
    updateTeamMemberController,
} from "./controller.js";

const requireAdmin = [authMiddleware, rbacMiddleware("ADMIN")];
const requireAdminOrManager = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER")];

export async function usersRoutes(fastify: FastifyInstance) {
    fastify.post("/admin/users", { preHandler: requireAdmin }, createUserController);
    fastify.get("/admin/users", { preHandler: requireAdmin }, getUsersController);
    fastify.get<{ Params: { id: string } }>("/admin/users/:id", { preHandler: requireAdmin }, getUserController);
    fastify.patch<{ Params: { id: string } }>("/admin/users/:id", { preHandler: requireAdmin }, updateUserController);
    fastify.delete<{ Params: { id: string } }>("/admin/users/:id", { preHandler: requireAdmin }, deleteUserController);

    fastify.get("/admin/team", { preHandler: requireAdminOrManager }, getTeamController);
    fastify.patch<{ Params: { id: string } }>("/admin/team/:id", { preHandler: requireAdminOrManager }, updateTeamMemberController);
}
