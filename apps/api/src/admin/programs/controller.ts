import type { FastifyRequest, FastifyReply } from "fastify";
import {
  createProgram,
  getPrograms,
  updateProgram,
  deleteProgram,
} from "./service.js";
import { createProgramSchema, updateProgramSchema } from "./programs.schema.js";
import { handleResult, handleError } from "../../shared/response.js";
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
    return handleResult(reply, { data: result, statusCode: 201 });
  } catch (err) {
    return handleResult(reply, handleError(err, "Validation failed"));
  }
}

export async function getProgramsController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const data = await getPrograms(tenantId);
    return handleResult(reply, { data });
  } catch (err) {
    return handleResult(reply, handleError(err, "Failed to fetch programs"));
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
    return handleResult(reply, { data: result });
  } catch (err) {
    const e = handleError(err, "Update failed");
    if (e.error === "Program not found") e.statusCode = 404;
    return handleResult(reply, e);
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
    return handleResult(reply, { data: result });
  } catch (err) {
    const e = handleError(err, "Delete failed");
    if (e.error === "Program not found") e.statusCode = 404;
    return handleResult(reply, e);
  }
}
