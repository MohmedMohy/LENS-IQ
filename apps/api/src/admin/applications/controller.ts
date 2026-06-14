// src/admin/applications/controller.ts

import type { FastifyRequest, FastifyReply } from "fastify";
import {
    createApplication,
    getApplications,
    updateApplicationStatus,
} from "./service.js";

export async function createApplicationController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const body = req.body as {
            customer_id: number;
            vehicle_id: number;
            requested_down_payment: number;
            requested_months: number;
            payment_method?: string;
            notes?: string;
        };
        const result = await createApplication(body, tenantId);
        return reply.status(201).send({ success: true, data: result });
    } catch (err: any) {
        return reply.status(400).send({ success: false, message: err.message });
    }
}

export async function getApplicationsController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const data = await getApplications(tenantId);
        return reply.send({ success: true, data });
    } catch (err: any) {
        return reply.status(500).send({ success: false, message: err.message });
    }
}

export async function updateApplicationStatusController(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const { status } = req.body as { status: string };
        const result = await updateApplicationStatus(id, status, tenantId);
        return reply.send({ success: true, data: result });
    } catch (err: any) {
        const code = err.message === "Application not found" ? 404 : 400;
        return reply.status(code).send({ success: false, message: err.message });
    }
}