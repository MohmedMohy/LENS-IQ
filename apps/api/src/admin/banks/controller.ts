import type { FastifyRequest, FastifyReply } from "fastify";
import { createBank, getBanks, updateBank, deleteBank } from "./service.js";
import { createBankSchema, updateBankSchema } from "./banks.schema.js";
import { handleResult, handleError } from "../../shared/response.js";
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
        return handleResult(reply, { data: result, statusCode: 201 });
    } catch (err) {
        const e = handleError(err, "Validation failed");
        return handleResult(reply, e);
    }
}

export async function getBanksController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const data = await getBanks(tenantId);
        return handleResult(reply, { data });
    } catch (err) {
        const e = handleError(err, "Failed to fetch banks");
        return handleResult(reply, e);
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
        return handleResult(reply, { data: result });
    } catch (err) {
        const e = handleError(err, "Update failed");
        if (e.error === "Bank not found") e.statusCode = 404;
        return handleResult(reply, e);
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
        return handleResult(reply, { data: result });
    } catch (err) {
        const e = handleError(err, "Delete failed");
        if (e.error === "Bank not found") e.statusCode = 404;
        return handleResult(reply, e);
    }
}
