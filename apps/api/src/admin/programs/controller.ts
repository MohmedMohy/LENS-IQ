import type { FastifyRequest, FastifyReply } from "fastify";

import {
  createProgram,
  getPrograms,
  updateProgram,
  deleteProgram,
} from "./service.js";

import {
  createProgramSchema,
  updateProgramSchema,
} from "./programs.schema.js";

import { sendSuccess, sendError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

export async function createProgramController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const body = createProgramSchema.parse(req.body);
    const result = await createProgram(body, tenantId);
    logAudit({ tenantId, userId: req.userId, action: "create", entity: "program", entityId: result.id });
    return sendSuccess(reply, result, 201);
  } catch (err: any) {
    if (err?.issues) return sendError(reply, "Validation failed", 400, err.issues);
    return sendError(reply, err.message || "Validation failed", 400);
  }
}

export async function getProgramsController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const data = await getPrograms(tenantId);
    return sendSuccess(reply, data);
  } catch (err: any) {
    return sendError(reply, err.message || "Failed to fetch programs", 500);
  }
}

export async function updateProgramController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const id = Number(req.params.id);
    const body = updateProgramSchema.parse(req.body);
    const result = await updateProgram(id, body, tenantId);
    logAudit({ tenantId, userId: req.userId, action: "update", entity: "program", entityId: id });
    return sendSuccess(reply, result);
  } catch (err: any) {
    if (err?.issues) return sendError(reply, "Update failed", 400, err.issues);
    if (err.message === "Program not found") return sendError(reply, err.message, 404);
    return sendError(reply, err.message || "Update failed", 400);
  }
}

export async function deleteProgramController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const id = Number(req.params.id);
    const result = await deleteProgram(id, tenantId);
    logAudit({ tenantId, userId: req.userId, action: "delete", entity: "program", entityId: id });
    return sendSuccess(reply, result);
  } catch (err: any) {
    if (err.message === "Program not found") return sendError(reply, err.message, 404);
    return sendError(reply, err.message || "Delete failed", 400);
  }
}
