// src/admin/programs/controller.ts

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

/* CREATE */
export async function createProgramController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId; // ✅
    const body = createProgramSchema.parse(req.body);

    const result = await createProgram(body, tenantId); // ✅

    return reply.send(result);
  } catch (err) {
    return reply.status(400).send({
      error: "Validation failed",
      details: err,
    });
  }
}

/* GET */
export async function getProgramsController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const tenantId = req.tenantId; // ✅
  const data = await getPrograms(tenantId); // ✅
  return reply.send(data);
}

/* UPDATE */
export async function updateProgramController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId; // ✅
    const id = Number(req.params.id);
    const body = updateProgramSchema.parse(req.body);

    const result = await updateProgram(id, body, tenantId); // ✅

    return reply.send(result);
  } catch (err) {
    return reply.status(400).send({
      error: "Update failed",
      details: err,
    });
  }
}

/* DELETE */
export async function deleteProgramController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const tenantId = req.tenantId; // ✅
  const id = Number(req.params.id);

  const result = await deleteProgram(id, tenantId); // ✅

  return reply.send(result);
}