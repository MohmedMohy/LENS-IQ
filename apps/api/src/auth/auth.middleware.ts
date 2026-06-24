import crypto from "crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "./token.service.js";
import { db } from "../db/db.js";

export async function authMiddleware(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            if (!token) throw new Error("Invalid token");
            const payload = verifyAccessToken(token);
            req.tenantId = payload.tenantId;
            req.tenantRole = payload.role;
            if (payload.userId) req.userId = payload.userId;
            if (payload.userType) req.userType = payload.userType;
            return;
        }

        const cookieToken = req.cookies?.access_token;
        if (cookieToken) {
            const payload = verifyAccessToken(cookieToken);
            req.tenantId = payload.tenantId;
            req.tenantRole = payload.role;
            if (payload.userId) req.userId = payload.userId;
            if (payload.userType) req.userType = payload.userType;
            return;
        }

        const apiKey = req.headers["x-api-key"] as string;
        if (apiKey) {
            const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
            const result = await db.query(
                `SELECT id, role FROM tenants WHERE api_key_hash = $1 AND active = true`,
                [apiKeyHash]
            );
            if (!result.rows[0]) throw new Error("Invalid API key");
            req.tenantId = result.rows[0].id;
            req.tenantRole = result.rows[0].role;
            return;
        }

        throw new Error("Unauthorized");

    } catch {
        return reply.status(401).send({ success: false, message: "Unauthorized" });
    }
}
