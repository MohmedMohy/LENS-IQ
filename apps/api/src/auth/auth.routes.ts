import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
    registerTenant,
    loginTenant,
    refreshTokens,
    logout,
    getTenantById,
    getUserById,
    updateTenantProfile,
    changeTenantPassword,
    regenerateApiKey,
} from "./auth.service.js";
import { authMiddleware } from "./auth.middleware.js";
import { rbacMiddleware } from "./rbac.middleware.js";
import { setAuthCookies, clearAuthCookies } from "./cookie.service.js";
import { sendSuccess, sendError } from "../shared/response.js";
import { db } from "../db/db.js";
import { logAudit } from "../shared/audit.service.js";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
});

const changePasswordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
});

export async function authRoutes(fastify: FastifyInstance) {

    fastify.post("/auth/register", async (req, reply) => {
        try {
            const { name, email, password } = registerSchema.parse(req.body);
            const tenant = await registerTenant(name, email, password);
            await logAudit({ tenantId: tenant.id, action: "register", entity: "tenant", entityId: tenant.id });
            return sendSuccess(reply, tenant, 201);
        } catch (err) {
            if (err instanceof z.ZodError) {
                return sendError(reply, "Validation failed", 400, err.issues);
            }
            return sendError(reply, (err as Error).message, 400);
        }
    });

    fastify.post("/auth/login", async (req, reply) => {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const result = await loginTenant(email, password);

            setAuthCookies(reply, result.accessToken, result.refreshToken);

            logAudit({ tenantId: result.tenant.id, userId: result.tenant.id, action: "login", entity: "tenant", entityId: result.tenant.id });

            return sendSuccess(reply, {
                accessToken: result.accessToken,
                tenant: result.tenant,
            });
        } catch (err) {
            if (err instanceof z.ZodError) {
                return sendError(reply, "Validation failed", 400, err.issues);
            }
            return sendError(reply, (err as Error).message, 401);
        }
    });

    fastify.post("/auth/refresh", async (req, reply) => {
        try {
            const refreshToken = req.cookies?.refresh_token;
            if (!refreshToken) {
                return sendError(reply, "Refresh token not found", 401);
            }

            const result = await refreshTokens(refreshToken);
            setAuthCookies(reply, result.accessToken, result.refreshToken);

            return sendSuccess(reply, {
                accessToken: result.accessToken,
                tenant: result.tenant,
            });
        } catch (err) {
            clearAuthCookies(reply);
            return sendError(reply, (err as Error).message, 401);
        }
    });

    fastify.post("/auth/logout", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            const refreshToken = req.cookies?.refresh_token;
            await logout(req.tenantId, refreshToken, req.userId);
            clearAuthCookies(reply);
            return sendSuccess(reply);
        } catch (err) {
            return sendError(reply, (err as Error).message, 400);
        }
    });

    fastify.get("/me", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            let info: { id: number; name: string; email: string; role: string; max_users?: number };
            let maxUsers: number | undefined;
            let userCount: number | undefined;

            if (req.userType === "user" && req.userId) {
                info = await getUserById(req.userId, req.tenantId);
            } else {
                info = await getTenantById(req.tenantId);
                maxUsers = info.max_users;
                const countResult = await db.query(
                    `SELECT COUNT(*)::int as count FROM users WHERE tenant_id = $1 AND active = true`,
                    [req.tenantId]
                );
                userCount = countResult.rows[0].count;
            }

            return sendSuccess(reply, {
                id: info.id,
                name: info.name,
                email: info.email,
                role: info.role,
                max_users: 7,
                user_count: userCount,
            });
        } catch (err) {
            return sendError(reply, (err as Error).message, 404);
        }
    });

    fastify.get("/auth/profile", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            const tenantId = req.tenantId;
            const tenant = await getTenantById(tenantId);
            return sendSuccess(reply, tenant);
        } catch (err) {
            return sendError(reply, (err as Error).message, 404);
        }
    });

    fastify.patch("/auth/profile", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            const tenantId = req.tenantId;
            const { name } = updateProfileSchema.parse(req.body);
            const tenant = await updateTenantProfile(tenantId, name);
            return sendSuccess(reply, tenant);
        } catch (err) {
            if (err instanceof z.ZodError) {
                return sendError(reply, "Validation failed", 400, err.issues);
            }
            return sendError(reply, (err as Error).message, 400);
        }
    });

    fastify.patch("/auth/password", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            const tenantId = req.tenantId;
            const { current_password, new_password } = changePasswordSchema.parse(req.body);
            const result = await changeTenantPassword(tenantId, current_password, new_password);
            await logAudit({ tenantId, userId: req.userId, action: "change_password", entity: "tenant", entityId: tenantId });
            return sendSuccess(reply, result);
        } catch (err) {
            if (err instanceof z.ZodError) {
                return sendError(reply, "Validation failed", 400, err.issues);
            }
            return sendError(reply, (err as Error).message, 400);
        }
    });

    fastify.post("/auth/regenerate-key", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            const tenantId = req.tenantId;
            const tenant = await regenerateApiKey(tenantId);
            await logAudit({ tenantId, userId: req.userId, action: "regenerate_api_key", entity: "tenant", entityId: tenantId });
            return sendSuccess(reply, tenant);
        } catch (err) {
            return sendError(reply, (err as Error).message, 400);
        }
    });
}
