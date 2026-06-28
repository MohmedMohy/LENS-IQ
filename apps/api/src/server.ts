import "dotenv/config";
import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifyCookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import crypto from "node:crypto";

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

import { validateEnv } from "./shared/env.js";
validateEnv();

import { authRoutes } from "./auth/auth.routes.js";
import { banksRoutes } from "./admin/banks/routes.js";
import { programsRoutes } from "./admin/programs/routes.js";
import { rulesRoutes } from "./admin/rules/routes.js";
import { customersRoutes } from "./admin/customers/routes.js";
import { vehiclesRoutes } from "./admin/vehicles/routes.js";
import { applicationsRoutes } from "./admin/applications/routes.js";
import { evaluateRoutes } from "./routes/evaluate.js";
import { publicApplyRoutes } from "./routes/public.apply.js";
import { optimizeRoutes } from "./routes/optimize.js";
import { financierRoutes } from "./financier/routes.js";
import { evaluateRecommendationRoutes } from "./routes/engine/evaluateRecommendation.js";
import { bankRequirementsRoutes } from "./routes/banks/requirements.js";
import { bankDecisionRoutes } from "./routes/applications/bankDecision.js";
import { applicationFormRoutes } from "./routes/applicationPdf.js";
import { usersRoutes } from "./admin/users/routes.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { auditRoutes } from "./admin/audit/routes.js";
import { db } from "./db/db.js";
import { sendError } from "./shared/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findFrontendDist(): string | null {
  if (process.env.FRONTEND_DIST) return process.env.FRONTEND_DIST;
  const candidates = [
    path.join(__dirname, "..", "admin-dashboard", "dist"),
    path.join(__dirname, "..", "..", "apps", "admin-dashboard", "dist"),
    path.join(__dirname, "..", "..", "admin-dashboard", "dist"),
    path.join(__dirname, "..", "..", "..", "admin-dashboard", "dist"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}
const FRONTEND_DIST = findFrontendDist();
const API_PREFIXES = ["/auth", "/admin", "/evaluate", "/optimize", "/public", "/health", "/me", "/dashboard", "/banks", "/applications", "/engine", "/application"];

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

const cookieSecret = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString("hex");
await fastify.register(fastifyCookie, {
  secret: cookieSecret,
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  allowList: ["127.0.0.1", "::1"],
});

fastify.addHook("onRoute", (routeOptions) => {
  if (routeOptions.url === "/auth/login" && routeOptions.method === "POST") {
    const prev = routeOptions.config || {};
    routeOptions.config = {
      ...prev,
      rateLimit: {
        max: 5,
        timeWindow: "15 minutes",
      },
    };
  }
  if (routeOptions.url === "/auth/register" && routeOptions.method === "POST") {
    const prev = routeOptions.config || {};
    routeOptions.config = {
      ...prev,
      rateLimit: {
        max: 3,
        timeWindow: "1 hour",
      },
    };
  }
  if (routeOptions.url?.startsWith("/public") && routeOptions.method === "POST") {
    const prev = routeOptions.config || {};
    routeOptions.config = {
      ...prev,
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
      },
    };
  }
  if (routeOptions.url === "/evaluate" && routeOptions.method === "POST") {
    const prev = routeOptions.config || {};
    routeOptions.config = {
      ...prev,
      rateLimit: {
        max: 30,
        timeWindow: "1 minute",
      },
    };
  }
});

fastify.addHook("onRequest", async (request, reply) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  reply.headers({ "x-request-id": requestId });
});

fastify.setErrorHandler((error: FastifyError | Error, _request, reply) => {
  fastify.log.error(error);
  const statusCode = "statusCode" in error ? (error as FastifyError).statusCode ?? 500 : 500;
  const message = statusCode === 500 ? "Internal server error" : (error.message || "Unknown error");
  return sendError(reply, message, statusCode);
});

const WIDGET_ORIGINS = allowedOrigins.filter(o => o !== "http://localhost:5173" && o !== "http://localhost:4000");
const frameAncestors = WIDGET_ORIGINS.length > 0 ? WIDGET_ORIGINS.join(" ") : "'none'";

fastify.addHook("onSend", async (request, reply, payload) => {
  const isWidgetRequest = request.url?.startsWith("/evaluate") && request.headers["x-api-key"];
  reply.headers({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": isWidgetRequest ? "ALLOW-FROM " + (WIDGET_ORIGINS[0] || "") : "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; frame-ancestors ${frameAncestors}; base-uri 'self'`,
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
await usersRoutes(fastify);
await dashboardRoutes(fastify);
await auditRoutes(fastify);
await evaluateRoutes(fastify);
await optimizeRoutes(fastify);
await financierRoutes(fastify);
await evaluateRecommendationRoutes(fastify);
await bankRequirementsRoutes(fastify);
await bankDecisionRoutes(fastify);
await publicApplyRoutes(fastify);
await applicationFormRoutes(fastify);

fastify.get("/health", async () => {
  try {
    await db.query("SELECT 1");
    return { status: "ok", db: "connected", timestamp: new Date().toISOString() };
  } catch {
    return { status: "error", db: "disconnected" };
  }
});

if (FRONTEND_DIST) {
  try {
    await fastify.register(fastifyStatic, {
      root: FRONTEND_DIST,
      prefix: "/assets/",
      decorateReply: false,
    });
  } catch {
    fastify.log.warn("Frontend dist not found, skipping static serving");
  }
}

const INDEX_HTML = FRONTEND_DIST ? path.join(FRONTEND_DIST, "index.html") : null;
const FAVICON_PATH = FRONTEND_DIST && existsSync(path.join(FRONTEND_DIST, "favicon.svg"))
  ? path.join(FRONTEND_DIST, "favicon.svg") : null;
let indexContent: string | null = null;

if (FAVICON_PATH) {
  fastify.get("/favicon.svg", async (_request, reply) => {
    return reply.type("image/svg+xml").send(readFileSync(FAVICON_PATH));
  });
}

fastify.setNotFoundHandler((request, reply) => {
  if (request.method === "GET" && !API_PREFIXES.some(p => request.url.startsWith(p))) {
    if (INDEX_HTML) {
      if (!indexContent) {
        try { indexContent = readFileSync(INDEX_HTML, "utf-8"); } catch { /* ignore */ }
      }
      if (indexContent) {
        return reply.type("text/html").send(indexContent);
      }
    }
    return reply.status(404).send({ success: false, message: "Resource not found" });
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
