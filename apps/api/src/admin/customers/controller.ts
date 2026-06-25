import type { FastifyReply, FastifyRequest } from "fastify";
import {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
} from "./service.js";
import type { CreateCustomerDTO, UpdateCustomerDTO } from "./customers.schema.js";
import { handleResult, handleError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

type IdParams = { id: string };

export async function createCustomerController(
    request: FastifyRequest<{ Body: CreateCustomerDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const customer = await createCustomer(request.body, tenantId);
        logAudit({ tenantId, userId: request.userId, action: "create", entity: "customer", entityId: customer.id });
        return handleResult(reply, { data: customer, statusCode: 201 });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to create customer"));
    }
}

export async function getCustomersController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const customers = await getCustomers(tenantId);
        return handleResult(reply, { data: customers });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to fetch customers"));
    }
}

export async function getCustomerByIdController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const customer = await getCustomerById(Number(request.params.id), tenantId);
        return handleResult(reply, { data: customer });
    } catch (err) {
        const e = handleError(err, "Customer not found");
        if (e.error === "Customer not found") e.statusCode = 404;
        return handleResult(reply, e);
    }
}

export async function updateCustomerController(
    request: FastifyRequest<{ Params: IdParams; Body: UpdateCustomerDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const updated = await updateCustomer(Number(request.params.id), request.body, tenantId);
        logAudit({ tenantId, userId: request.userId, action: "update", entity: "customer", entityId: Number(request.params.id) });
        return handleResult(reply, { data: updated });
    } catch (err) {
        const e = handleError(err, "Customer not found");
        if (e.error === "Customer not found") e.statusCode = 404;
        return handleResult(reply, e);
    }
}

export async function deleteCustomerController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        await deleteCustomer(Number(request.params.id), tenantId);
        logAudit({ tenantId, userId: request.userId, action: "delete", entity: "customer", entityId: Number(request.params.id) });
        return handleResult(reply, { data: { id: Number(request.params.id) } });
    } catch (err) {
        const e = handleError(err, "Customer not found");
        if (e.error === "Customer not found") e.statusCode = 404;
        return handleResult(reply, e);
    }
}
