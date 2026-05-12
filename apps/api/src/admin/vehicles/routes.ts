// src/admin/vehicles/routes.ts

import type { FastifyInstance } from "fastify";

import { authMiddleware } from "../../auth/auth.middleware.js";

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

export async function vehiclesRoutes(fastify: FastifyInstance) {
    fastify.post<{
        Body: CreateVehicleDTO;
    }>(
        "/admin/vehicles",
        {
            preHandler: authMiddleware,
        },
        createVehicleController
    );

    fastify.get(
        "/admin/vehicles",
        {
            preHandler: authMiddleware,
        },
        getVehiclesController
    );

    fastify.get<{
        Params: IdParams;
    }>(
        "/admin/vehicles/:id",
        {
            preHandler: authMiddleware,
        },
        getVehicleByIdController
    );

    fastify.patch<{
        Params: IdParams;
        Body: UpdateVehicleDTO;
    }>(
        "/admin/vehicles/:id",
        {
            preHandler: authMiddleware,
        },
        updateVehicleController
    );

    fastify.delete<{
        Params: IdParams;
    }>(
        "/admin/vehicles/:id",
        {
            preHandler: authMiddleware,
        },
        deleteVehicleController
    );
}