// src/admin/customers/routes.ts

import type { FastifyInstance } from "fastify";

import { authMiddleware } from "../../auth/auth.middleware.js";

import {
    createCustomerController,
    getCustomersController,
    getCustomerByIdController,
    updateCustomerController,
    deleteCustomerController,
} from "./controller.js";

import {
    createCustomerSchema,
    updateCustomerSchema,
    type CreateCustomerDTO,
    type UpdateCustomerDTO,
} from "./customers.schema.js";

type IdParams = {
    id: string;
};

export async function customersRoutes(fastify: FastifyInstance) {
    fastify.post<{
        Body: CreateCustomerDTO;
    }>(
        "/admin/customers",
        {
            preHandler: authMiddleware,
        },
        createCustomerController
    );

    fastify.get(
        "/admin/customers",
        {
            preHandler: authMiddleware,
        },
        getCustomersController
    );

    fastify.get<{
        Params: IdParams;
    }>(
        "/admin/customers/:id",
        {
            preHandler: authMiddleware,
        },
        getCustomerByIdController
    );

    fastify.patch<{
        Params: IdParams;
        Body: UpdateCustomerDTO;
    }>(
        "/admin/customers/:id",
        {
            preHandler: authMiddleware,
        },
        updateCustomerController
    );

    fastify.delete<{
        Params: IdParams;
    }>(
        "/admin/customers/:id",
        {
            preHandler: authMiddleware,
        },
        deleteCustomerController
    );
}