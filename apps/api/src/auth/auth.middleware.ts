// src/auth/auth.middleware.ts

import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "./auth.service.js";
import { db } from "../db/db.js";

export async function authMiddleware(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        //  JWT من الـ header
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];

            if (!token) throw new Error("Invalid token"); //  الحل

            const payload = verifyToken(token);
            (req as any).tenantId = payload.tenantId;
            return;
        }

        //  API key من الـ header
        const apiKey = req.headers["x-api-key"] as string;

        if (apiKey) {
            const result = await db.query(
                `SELECT id FROM tenants WHERE api_key = $1 AND active = true`,
                [apiKey]
            );

            if (!result.rows[0]) throw new Error("Invalid API key");

            (req as any).tenantId = result.rows[0].id;
            return;
        }

        throw new Error("Unauthorized");

    } catch {
        return reply.status(401).send({ error: "Unauthorized" });
    }
}