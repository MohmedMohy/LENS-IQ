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

import { sendSuccess, sendError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

type IdParams = { id: string };

export async function createVehicleController(
    request: FastifyRequest<{ Body: CreateVehicleDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const vehicle = await createVehicle(request.body, tenantId);
        logAudit({ tenantId, userId: request.userId, action: "create", entity: "vehicle", entityId: vehicle.id });
        return sendSuccess(reply, vehicle, 201);
    } catch (err: any) {
        return sendError(reply, err.message ?? "Failed to create vehicle", 500);
    }
}

export async function getVehiclesController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const vehicles = await getVehicles(tenantId);
        return sendSuccess(reply, vehicles);
    } catch (err: any) {
        return sendError(reply, err.message ?? "Failed to fetch vehicles", 500);
    }
}

export async function getVehicleByIdController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const vehicle = await getVehicleById(Number(request.params.id), tenantId);
        return sendSuccess(reply, vehicle);
    } catch (err: any) {
        const status = err.message === "Vehicle not found" ? 404 : 500;
        return sendError(reply, err.message, status);
    }
}

export async function updateVehicleController(
    request: FastifyRequest<{ Params: IdParams; Body: UpdateVehicleDTO }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const vehicle = await updateVehicle(Number(request.params.id), request.body, tenantId);
        logAudit({ tenantId, userId: request.userId, action: "update", entity: "vehicle", entityId: Number(request.params.id) });
        return sendSuccess(reply, vehicle);
    } catch (err: any) {
        const status = err.message === "Vehicle not found" ? 404 : 500;
        return sendError(reply, err.message, status);
    }
}

export async function deleteVehicleController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        await deleteVehicle(Number(request.params.id), tenantId);
        logAudit({ tenantId, userId: request.userId, action: "delete", entity: "vehicle", entityId: Number(request.params.id) });
        return sendSuccess(reply, { id: Number(request.params.id) });
    } catch (err: any) {
        const status = err.message === "Vehicle not found" ? 404 : 500;
        return sendError(reply, err.message, status);
    }
}
