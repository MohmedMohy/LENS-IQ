// src/admin/vehicles/controller.ts

import type { FastifyReply, FastifyRequest } from "fastify";

import {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
} from "./service.js";

import type {
    CreateVehicleDTO,
    UpdateVehicleDTO,
} from "./vehicles.schema.js";

type IdParams = {
    id: string;
};

export async function createVehicleController(
    request: FastifyRequest<{ Body: CreateVehicleDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        const vehicle = await createVehicle(request.body, tenantId);
        return reply.code(201).send({ success: true, data: vehicle });
    } catch (err: any) {
        return reply.code(500).send({ success: false, message: err.message ?? "Failed to create vehicle" });
    }
}

export async function getVehiclesController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        const vehicles = await getVehicles(tenantId);
        return reply.send({ success: true, data: vehicles });
    } catch (err: any) {
        return reply.code(500).send({ success: false, message: err.message ?? "Failed to fetch vehicles" });
    }
}

export async function getVehicleByIdController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        const vehicle = await getVehicleById(Number(request.params.id), tenantId);
        return reply.send({ success: true, data: vehicle });
    } catch (err: any) {
        const status = err.message === "Vehicle not found" ? 404 : 500;
        return reply.code(status).send({ success: false, message: err.message });
    }
}

export async function updateVehicleController(
    request: FastifyRequest<{ Params: IdParams; Body: UpdateVehicleDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        const vehicle = await updateVehicle(Number(request.params.id), request.body, tenantId);
        return reply.send({ success: true, data: vehicle });
    } catch (err: any) {
        const status = err.message === "Vehicle not found" ? 404 : 500;
        return reply.code(status).send({ success: false, message: err.message });
    }
}

export async function deleteVehicleController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = (request as any).tenantId as number;
        await deleteVehicle(Number(request.params.id), tenantId);
        return reply.send({ success: true, message: "Vehicle deleted" });
    } catch (err: any) {
        const status = err.message === "Vehicle not found" ? 404 : 500;
        return reply.code(status).send({ success: false, message: err.message });
    }
}