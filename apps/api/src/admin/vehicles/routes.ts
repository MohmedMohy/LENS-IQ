import type { FastifyInstance } from "fastify";

import { authMiddleware } from "../../auth/auth.middleware.js";
import { rbacMiddleware } from "../../auth/rbac.middleware.js";

import {
    createVehicleController,
    getVehiclesController,
    getVehicleByIdController,
    updateVehicleController,
    deleteVehicleController,
} from "./controller.js";

import type {
    CreateVehicleDTO,
    UpdateVehicleDTO,
} from "./vehicles.schema.js";

type IdParams = {
    id: string;
};

const requireWrite = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER")];
const requireRead = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER", "SALES_AGENT")];

export async function vehiclesRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: CreateVehicleDTO }>(
        "/admin/vehicles",
        { preHandler: requireWrite },
        createVehicleController
    );

    fastify.get(
        "/admin/vehicles",
        { preHandler: requireRead },
        getVehiclesController
    );

    fastify.get<{ Params: IdParams }>(
        "/admin/vehicles/:id",
        { preHandler: requireRead },
        getVehicleByIdController
    );

    fastify.patch<{ Params: IdParams; Body: UpdateVehicleDTO }>(
        "/admin/vehicles/:id",
        { preHandler: requireWrite },
        updateVehicleController
    );

    fastify.delete<{ Params: IdParams }>(
        "/admin/vehicles/:id",
        { preHandler: requireWrite },
        deleteVehicleController
    );
}
