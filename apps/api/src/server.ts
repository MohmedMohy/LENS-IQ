import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

import { authRoutes } from "./auth/auth.routes.js";
import { banksRoutes } from "./admin/banks/routes.js";
import { programsRoutes } from "./admin/programs/routes.js";
import { rulesRoutes } from "./admin/rules/routes.js";
import { customersRoutes } from "./admin/customers/routes.js";
import { vehiclesRoutes } from "./admin/vehicles/routes.js";
import { applicationsRoutes } from "./admin/applications/routes.js";
import { evaluateRoutes } from "./routes/evaluate.js";
import { publicApplyRoutes } from "./routes/public.apply.js";
import { db } from "./db/db.js";
import { sendError } from "./shared/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findFrontendDist(): string | null {
  if (process.env.FRONTEND_DIST) return process.env.FRONTEND_DIST;
  const candidates = [
    // Combined Docker: /app/dist -> /app/admin-dashboard/dist
    path.join(__dirname, "..", "admin-dashboard", "dist"),
    // Combined Docker (new layout): /app/dist -> /app/apps/admin-dashboard/dist
    path.join(__dirname, "..", "..", "apps", "admin-dashboard", "dist"),
    // Local (apps/api/src -> apps/admin-dashboard/dist)
    path.join(__dirname, "..", "..", "admin-dashboard", "dist"),
    // Old location (apps/api/dist -> admin-dashboard/dist)
    path.join(__dirname, "..", "..", "..", "admin-dashboard", "dist"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}
const FRONTEND_DIST = findFrontendDist();
const API_PREFIXES = ["/auth", "/admin", "/evaluate", "/public", "/health"];

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : [
      "http://localhost:5173",
      "http://localhost:4000",
      "http://localhost:3000",
    ];

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
  trustProxy: true,
  bodyLimit: 1048576,
});

await fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  allowList: ["127.0.0.1", "::1"],
});

fastify.setErrorHandler((error, _request, reply) => {
  fastify.log.error(error);
  const err = error as { statusCode?: number; message?: string };
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error" : (err.message || "Unknown error");
  return sendError(reply, message, statusCode);
});

fastify.addHook("onSend", async (_request, reply, payload) => {
  reply.headers({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  });
  return payload;
});

await authRoutes(fastify);
await banksRoutes(fastify);
await programsRoutes(fastify);
await rulesRoutes(fastify);
await customersRoutes(fastify);
await vehiclesRoutes(fastify);
await applicationsRoutes(fastify);
await evaluateRoutes(fastify);
await publicApplyRoutes(fastify);

fastify.get("/health", async () => {
  try {
    await db.query("SELECT 1");
    return { status: "ok", db: "connected", timestamp: new Date().toISOString() };
  } catch {
    return { status: "error", db: "disconnected" };
  }
});

/* ─── Serve frontend static files ─── */
if (FRONTEND_DIST) {
  try {
    await fastify.register(fastifyStatic, {
      root: FRONTEND_DIST,
      prefix: "/",
      wildcard: true,
    });
  } catch {
    fastify.log.warn("Frontend dist not found, skipping static serving");
  }
}

/* ─── SPA fallback for non-API GET routes ─── */
fastify.setNotFoundHandler((request, reply) => {
  if (request.method === "GET" && !API_PREFIXES.some(p => request.url.startsWith(p))) {
    return reply.sendFile("index.html");
  }
  return reply.status(404).send({ success: false, message: "Route not found" });
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Backend running on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  await fastify.close();
  await db.end();
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

start();
