import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
    createApplication,
    getApplications,
    getApplicationById,
    updateApplicationStatus,
} from "./service.js";
import { sendSuccess, sendError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

const createApplicationSchema = z.object({
    customer_id: z.number().int().positive(),
    vehicle_id: z.number().int().positive(),
    requested_down_payment: z.number().positive(),
    requested_months: z.number().int().positive(),
    payment_method: z.enum(["salary_transfer", "bank_account", "cash_proof"]).optional(),
    notes: z.string().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]),
});

export async function createApplicationController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const body = createApplicationSchema.parse(req.body);
        const result = await createApplication(body, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "create", entity: "application", entityId: result.id });
        return sendSuccess(reply, result, 201);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return sendError(reply, "Validation failed", 400, err.issues);
        }
        return sendError(reply, err.message, 400);
    }
}

export async function getApplicationsController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const data = await getApplications(tenantId);
        return sendSuccess(reply, data);
    } catch (err: any) {
        return sendError(reply, err.message, 500);
    }
}

export async function getApplicationByIdController(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const result = await getApplicationById(id, tenantId);
        return sendSuccess(reply, result);
    } catch (err: any) {
        const code = err.message === "Application not found" ? 404 : 500;
        return sendError(reply, err.message, code);
    }
}

export async function updateApplicationStatusController(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const { status } = updateStatusSchema.parse(req.body);

        if (status === "CANCELLED" && req.tenantRole === "SALES_AGENT") {
            return sendError(reply, "Only managers can cancel applications", 403);
        }

        const result = await updateApplicationStatus(id, status, tenantId);
        logAudit({ tenantId, userId: req.userId, action: `update_status_${status.toLowerCase()}`, entity: "application", entityId: id, details: { status } });
        return sendSuccess(reply, result);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return sendError(reply, "Validation failed", 400, err.issues);
        }
        const code = err.message === "Application not found" ? 404 : 400;
        return sendError(reply, err.message, code);
    }
}
