import type { FastifyReply, FastifyRequest } from "fastify";
import {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
} from "./service.js";
import type { CreateVehicleDTO, UpdateVehicleDTO } from "./vehicles.schema.js";
import { handleResult, handleError } from "../../shared/response.js";
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
        return handleResult(reply, { data: vehicle, statusCode: 201 });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to create vehicle"));
    }
}

export async function getVehiclesController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const vehicles = await getVehicles(tenantId);
        return handleResult(reply, { data: vehicles });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to fetch vehicles"));
    }
}

export async function getVehicleByIdController(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
) {
    try {
        const tenantId = request.tenantId;
        const vehicle = await getVehicleById(Number(request.params.id), tenantId);
        return handleResult(reply, { data: vehicle });
    } catch (err) {
        const e = handleError(err, "Vehicle not found");
        if (e.error === "Vehicle not found") e.statusCode = 404;
        return handleResult(reply, e);
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
        return handleResult(reply, { data: vehicle });
    } catch (err) {
        const e = handleError(err, "Vehicle not found");
        if (e.error === "Vehicle not found") e.statusCode = 404;
        return handleResult(reply, e);
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
        return handleResult(reply, { data: { id: Number(request.params.id) } });
    } catch (err) {
        const e = handleError(err, "Vehicle not found");
        if (e.error === "Vehicle not found") e.statusCode = 404;
        return handleResult(reply, e);
    }
}
