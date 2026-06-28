import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
    createApplication,
    getApplications,
    getApplicationById,
    updateApplicationStatus,
} from "./service.js";
import { handleResult, handleError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

const createApplicationSchema = z.object({
    customer_id: z.number().int().positive(),
    vehicle_id: z.number().int().positive(),
    requested_down_payment: z.number().min(0),
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
        return handleResult(reply, { data: result, statusCode: 201 });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to create application"));
    }
}

export async function getApplicationsController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const data = await getApplications(tenantId);
        return handleResult(reply, { data });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to fetch applications"));
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
        return handleResult(reply, { data: result });
    } catch (err) {
        const e = handleError(err, "Application not found");
        if (e.error === "Application not found") e.statusCode = 404;
        return handleResult(reply, e);
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
            return handleResult(reply, { error: "Only managers can cancel applications", statusCode: 403 });
        }

        const result = await updateApplicationStatus(id, status, tenantId);
        logAudit({ tenantId, userId: req.userId, action: `update_status_${status.toLowerCase()}`, entity: "application", entityId: id, details: { status } });
        return handleResult(reply, { data: result });
    } catch (err) {
        const e = handleError(err, "Failed to update status");
        if (e.error === "Application not found") e.statusCode = 404;
        return handleResult(reply, e);
    }
}
