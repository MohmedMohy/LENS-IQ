import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
    registerTenant,
    loginTenant,
    getTenantById,
    updateTenantProfile,
    changeTenantPassword,
    regenerateApiKey,
} from "./auth.service.js";
import { authMiddleware } from "./auth.middleware.js";

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
            return reply.status(201).send(tenant);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ error: "Validation failed", details: err.issues });
            }
            return reply.status(400).send({ error: err.message });
        }
    });

    fastify.post("/auth/login", async (req, reply) => {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const result = await loginTenant(email, password);
            return reply.send(result);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ error: "Validation failed", details: err.issues });
            }
            return reply.status(401).send({ error: err.message });
        }
    });

    fastify.get("/auth/profile", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            const tenantId = req.tenantId;
            const tenant = await getTenantById(tenantId);
            return reply.send(tenant);
        } catch (err: any) {
            return reply.status(404).send({ error: err.message });
        }
    });

    fastify.patch("/auth/profile", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            const tenantId = req.tenantId;
            const { name } = updateProfileSchema.parse(req.body);
            const tenant = await updateTenantProfile(tenantId, name);
            return reply.send(tenant);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ error: "Validation failed", details: err.issues });
            }
            return reply.status(400).send({ error: err.message });
        }
    });

    fastify.patch("/auth/password", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            const tenantId = req.tenantId;
            const { current_password, new_password } = changePasswordSchema.parse(req.body);
            const result = await changeTenantPassword(tenantId, current_password, new_password);
            return reply.send(result);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ error: "Validation failed", details: err.issues });
            }
            return reply.status(400).send({ error: err.message });
        }
    });

    fastify.post("/auth/regenerate-key", { preHandler: authMiddleware }, async (req, reply) => {
        try {
            const tenantId = req.tenantId;
            const tenant = await regenerateApiKey(tenantId);
            return reply.send(tenant);
        } catch (err: any) {
            return reply.status(400).send({ error: err.message });
        }
    });
}