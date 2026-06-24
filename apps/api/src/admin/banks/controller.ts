import type { FastifyRequest, FastifyReply } from "fastify";
import { createBank, getBanks, updateBank, deleteBank } from "./service.js";
import { createBankSchema, updateBankSchema } from "./banks.schema.js";
import { sendSuccess, sendError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

export async function createBankController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const body = createBankSchema.parse(req.body);
        const result = await createBank(body, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "create", entity: "bank", entityId: result.id });
        return sendSuccess(reply, result, 201);
    } catch (err: any) {
        if (err?.issues) return sendError(reply, "Validation failed", 400, err.issues);
        return sendError(reply, err.message || "Validation failed", 400);
    }
}

export async function getBanksController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const data = await getBanks(tenantId);
        return sendSuccess(reply, data);
    } catch (err: any) {
        return sendError(reply, err.message || "Failed to fetch banks", 500);
    }
}

export async function updateBankController(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const body = updateBankSchema.parse(req.body);
        const result = await updateBank(id, body, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "update", entity: "bank", entityId: id });
        return sendSuccess(reply, result);
    } catch (err: any) {
        if (err?.issues) return sendError(reply, "Update failed", 400, err.issues);
        if (err.message === "Bank not found") return sendError(reply, err.message, 404);
        return sendError(reply, err.message || "Update failed", 400);
    }
}

export async function deleteBankController(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const result = await deleteBank(id, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "delete", entity: "bank", entityId: id });
        return sendSuccess(reply, result);
    } catch (err: any) {
        if (err.message === "Bank not found") return sendError(reply, err.message, 404);
        return sendError(reply, err.message || "Delete failed", 400);
    }
}
