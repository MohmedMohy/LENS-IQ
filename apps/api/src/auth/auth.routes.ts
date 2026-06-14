// src/auth/auth.routes.ts

import type { FastifyInstance } from "fastify";
import {
    registerTenant,
    loginTenant,
    getTenantById,
    updateTenantProfile,
    changeTenantPassword,
    regenerateApiKey,
} from "./auth.service.js";
import { authMiddleware } from "./auth.middleware.js";

export async function authRoutes(fastify: FastifyInstance) {

    /* ── REGISTER ── */
    fastify.post<{
        Body: { name: string; email: string; password: string };
    }>(
        "/auth/register",
        async (req, reply) => {
            try {
                const { name, email, password } = req.body;
                const tenant = await registerTenant(name, email, password);
                return reply.status(201).send(tenant);
            } catch (err: any) {
                return reply.status(400).send({ error: err.message });
            }
        }
    );

    /* ── LOGIN ── */
    fastify.post<{
        Body: { email: string; password: string };
    }>(
        "/auth/login",
        async (req, reply) => {
            try {
                const { email, password } = req.body;
                const result = await loginTenant(email, password);
                return reply.send(result);
            } catch (err: any) {
                return reply.status(401).send({ error: err.message });
            }
        }
    );

    /* ── GET PROFILE ── */
    fastify.get(
        "/auth/profile",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const tenant = await getTenantById(tenantId);
                return reply.send(tenant);
            } catch (err: any) {
                return reply.status(404).send({ error: err.message });
            }
        }
    );

    /* ── UPDATE PROFILE (name) ── */
    fastify.patch<{
        Body: { name: string };
    }>(
        "/auth/profile",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const { name } = req.body;
                const tenant = await updateTenantProfile(tenantId, name);
                return reply.send(tenant);
            } catch (err: any) {
                return reply.status(400).send({ error: err.message });
            }
        }
    );

    /* ── CHANGE PASSWORD ── */
    fastify.patch<{
        Body: {
            current_password: string;
            new_password: string;
        };
    }>(
        "/auth/password",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const { current_password, new_password } = req.body;

                const result = await changeTenantPassword(
                    tenantId,
                    current_password,
                    new_password
                );

                return reply.send(result);
            } catch (err: any) {
                return reply.status(400).send({ error: err.message });
            }
        }
    );

    /* ── REGENERATE API KEY ── */
    fastify.post(
        "/auth/regenerate-key",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const tenant = await regenerateApiKey(tenantId);
                return reply.send(tenant);
            } catch (err: any) {
                return reply.status(400).send({ error: err.message });
            }
        }
    );
}