// src/server.ts

import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

import { authRoutes } from "./auth/auth.routes.js";
import { banksRoutes } from "./admin/banks/routes.js";
import { programsRoutes } from "./admin/programs/routes.js";
import { rulesRoutes } from "./admin/rules/routes.js";
import { customersRoutes } from "./admin/customers/routes.js";
import { vehiclesRoutes } from "./admin/vehicles/routes.js";
import { applicationsRoutes } from "./admin/applications/routes.js";
import { evaluateRoutes } from "./routes/evaluate.js";


const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:4000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

await authRoutes(fastify);
await banksRoutes(fastify);
await programsRoutes(fastify);
await rulesRoutes(fastify);
await customersRoutes(fastify);
await vehiclesRoutes(fastify);
await applicationsRoutes(fastify);
await evaluateRoutes(fastify);

fastify.get("/health", async () => ({ status: "ok" }));

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Backend running on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();