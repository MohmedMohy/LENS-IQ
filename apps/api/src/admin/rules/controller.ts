import type { FastifyRequest, FastifyReply } from "fastify";
import { createRule, getRules, updateRule, deleteRule } from "./service.js";
import { createRuleSchema, updateRuleSchema } from "./schema.js";
import { handleResult, handleError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

export async function createRuleController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const body = createRuleSchema.parse(req.body);
    const rule = await createRule(body, tenantId);
    logAudit({ tenantId, userId: req.userId, action: "create", entity: "rule", entityId: rule.id });
    return handleResult(reply, { data: rule, statusCode: 201 });
  } catch (err) {
    return handleResult(reply, handleError(err, "Invalid rule"));
  }
}

export async function getRulesController(
  req: FastifyRequest<{ Params: { programId: string } }>,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const programId = Number(req.params.programId);
    const rules = await getRules(programId, tenantId);
    return handleResult(reply, { data: rules });
  } catch (err) {
    return handleResult(reply, handleError(err, "Failed to fetch rules"));
  }
}

export async function updateRuleController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const id = Number(req.params.id);
    const body = updateRuleSchema.parse(req.body);
    const rule = await updateRule(id, body, tenantId);
    logAudit({ tenantId, userId: req.userId, action: "update", entity: "rule", entityId: id });
    return handleResult(reply, { data: rule });
  } catch (err) {
    const e = handleError(err, "Update failed");
    if (e.error === "Rule not found") e.statusCode = 404;
    return handleResult(reply, e);
  }
}

export async function deleteRuleController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const tenantId = req.tenantId;
    const id = Number(req.params.id);
    const result = await deleteRule(id, tenantId);
    logAudit({ tenantId, userId: req.userId, action: "delete", entity: "rule", entityId: id });
    return handleResult(reply, { data: result });
  } catch (err) {
    const e = handleError(err, "Delete failed");
    if (e.error === "Rule not found") e.statusCode = 404;
    return handleResult(reply, e);
  }
}
