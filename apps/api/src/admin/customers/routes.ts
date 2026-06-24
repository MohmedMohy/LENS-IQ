import type { FastifyInstance } from "fastify";

import { authMiddleware } from "../../auth/auth.middleware.js";
import { rbacMiddleware } from "../../auth/rbac.middleware.js";

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

const requireWrite = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER")];
const requireRead = [authMiddleware, rbacMiddleware("ADMIN", "MANAGER", "SALES_AGENT")];

export async function customersRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: CreateCustomerDTO }>(
        "/admin/customers",
        { preHandler: requireWrite },
        createCustomerController
    );

    fastify.get(
        "/admin/customers",
        { preHandler: requireRead },
        getCustomersController
    );

    fastify.get<{ Params: IdParams }>(
        "/admin/customers/:id",
        { preHandler: requireRead },
        getCustomerByIdController
    );

    fastify.patch<{ Params: IdParams; Body: UpdateCustomerDTO }>(
        "/admin/customers/:id",
        { preHandler: requireWrite },
        updateCustomerController
    );

    fastify.delete<{ Params: IdParams }>(
        "/admin/customers/:id",
        { preHandler: requireWrite },
        deleteCustomerController
    );
}
