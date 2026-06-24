import type { FastifyReply, FastifyRequest } from "fastify";

import {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
} from "./service.js";

import type {
    CreateCustomerDTO,
    UpdateCustomerDTO,
} from "./customers.schema.js";

import { sendSuccess, sendError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

type IdParams = { id: string };

export async function createCustomerController(
    request: FastifyRequest<{ Body: CreateCustomerDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const customer = await createCustomer(request.body, tenantId);
        await logAudit({ tenantId, userId: request.userId, action: "create", entity: "customer", entityId: customer.id });
        return sendSuccess(reply, customer, 201);
    } catch (err: any) {
        return sendError(reply, err.message ?? "Failed to create customer", 500);
    }
}

export async function getCustomersController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const customers = await getCustomers(tenantId);
        return sendSuccess(reply, customers);
    } catch (err: any) {
        return sendError(reply, err.message ?? "Failed to fetch customers", 500);
    }
}

export async function getCustomerByIdController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const customer = await getCustomerById(Number(request.params.id), tenantId);
        return sendSuccess(reply, customer);
    } catch (err: any) {
        const status = err.message === "Customer not found" ? 404 : 500;
        return sendError(reply, err.message, status);
    }
}

export async function updateCustomerController(
    request: FastifyRequest<{ Params: IdParams; Body: UpdateCustomerDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const updated = await updateCustomer(Number(request.params.id), request.body, tenantId);
        await logAudit({ tenantId, userId: request.userId, action: "update", entity: "customer", entityId: Number(request.params.id) });
        return sendSuccess(reply, updated);
    } catch (err: any) {
        const status = err.message === "Customer not found" ? 404 : 500;
        return sendError(reply, err.message, status);
    }
}

export async function deleteCustomerController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        await deleteCustomer(Number(request.params.id), tenantId);
        await logAudit({ tenantId, userId: request.userId, action: "delete", entity: "customer", entityId: Number(request.params.id) });
        return sendSuccess(reply, { id: Number(request.params.id) });
    } catch (err: any) {
        const status = err.message === "Customer not found" ? 404 : 500;
        return sendError(reply, err.message, status);
    }
}
