// src/admin/customers/controller.ts

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

type IdParams = {
    id: string;
};

export async function createCustomerController(
    request: FastifyRequest<{ Body: CreateCustomerDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        const customer = await createCustomer(request.body, tenantId);
        return reply.code(201).send({ success: true, data: customer });
    } catch (err: any) {
        return reply.code(500).send({ success: false, message: err.message ?? "Failed to create customer" });
    }
}

export async function getCustomersController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        const customers = await getCustomers(tenantId);
        return reply.send({ success: true, data: customers });
    } catch (err: any) {
        return reply.code(500).send({ success: false, message: err.message ?? "Failed to fetch customers" });
    }
}

export async function getCustomerByIdController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        const customer = await getCustomerById(Number(request.params.id), tenantId);
        return reply.send({ success: true, data: customer });
    } catch (err: any) {
        const status = err.message === "Customer not found" ? 404 : 500;
        return reply.code(status).send({ success: false, message: err.message });
    }
}

export async function updateCustomerController(
    request: FastifyRequest<{ Params: IdParams; Body: UpdateCustomerDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        const updated = await updateCustomer(Number(request.params.id), request.body, tenantId);
        return reply.send({ success: true, data: updated });
    } catch (err: any) {
        const status = err.message === "Customer not found" ? 404 : 500;
        return reply.code(status).send({ success: false, message: err.message });
    }
}

export async function deleteCustomerController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        await deleteCustomer(Number(request.params.id), tenantId);
        return reply.send({ success: true, message: `Customer ${request.params.id} deleted` });
    } catch (err: any) {
        const status = err.message === "Customer not found" ? 404 : 500;
        return reply.code(status).send({ success: false, message: err.message });
    }
}