// src/admin/rules/controller.ts

import type { FastifyRequest, FastifyReply } from "fastify";
import { createRule, getRules, updateRule, deleteRule } from "./service.js";
import { createRuleSchema, updateRuleSchema } from "./schema.js";

/* CREATE RULE */
export async function createRuleController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const body = createRuleSchema.parse(req.body);

    const rule = await createRule(body, tenantId);

    return reply.send(rule);
  } catch (err) {
    return reply.status(400).send({
      error: "Invalid rule",
      details: err,
    });
  }
}

/* GET RULES */
export async function getRulesController(
  req: FastifyRequest<{ Params: { programId: string } }>,
  reply: FastifyReply
) {
  const tenantId = req.tenantId;
  const programId = Number(req.params.programId);

  const rules = await getRules(programId, tenantId);

  return reply.send(rules);
}

/* UPDATE RULE */
export async function updateRuleController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const id = Number(req.params.id);
    const body = updateRuleSchema.parse(req.body);

    const rule = await updateRule(id, body, tenantId);

    return reply.send(rule);
  } catch (err) {
    return reply.status(400).send({
      error: "Update failed",
      details: err,
    });
  }
}

/* DELETE RULE */
export async function deleteRuleController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const tenantId = req.tenantId;
  const id = Number(req.params.id);

  await deleteRule(id, tenantId);

  return reply.send({ success: true });
}