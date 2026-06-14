// src/admin/banks/controller.ts

import type { FastifyRequest, FastifyReply } from "fastify";
import { createBank, getBanks, updateBank, deleteBank } from "./service.js";
import { createBankSchema, updateBankSchema } from "./banks.schema.js";

/* CREATE */
export async function createBankController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const body = createBankSchema.parse(req.body);

        const result = await createBank(body, tenantId);

        return reply.status(201).send(result);
    } catch (err) {
        return reply.status(400).send({ error: "Validation failed", details: err });
    }
}

/* GET */
export async function getBanksController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    const tenantId = req.tenantId;
    const data = await getBanks(tenantId);
    return reply.send(data);
}

/* UPDATE */
export async function updateBankController(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const body = updateBankSchema.parse(req.body);

        const result = await updateBank(id, body, tenantId);

        return reply.send(result);
    } catch (err) {
        return reply.status(400).send({ error: "Update failed", details: err });
    }
}

/* DELETE */
export async function deleteBankController(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);

        const result = await deleteBank(id, tenantId);

        return reply.send(result);
    } catch (err) {
        return reply.status(400).send({ error: "Delete failed", details: err });
    }
}