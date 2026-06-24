import type { FastifyRequest, FastifyReply } from "fastify";
import { createRule, getRules, updateRule, deleteRule } from "./service.js";
import { createRuleSchema, updateRuleSchema } from "./schema.js";
import { sendSuccess, sendError } from "../../shared/response.js";
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
    return sendSuccess(reply, rule, 201);
  } catch (err: any) {
    if (err?.issues) return sendError(reply, "Invalid rule", 400, err.issues);
    return sendError(reply, err.message || "Invalid rule", 400);
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
    return sendSuccess(reply, rules);
  } catch (err: any) {
    return sendError(reply, err.message || "Failed to fetch rules", 500);
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
    return sendSuccess(reply, rule);
  } catch (err: any) {
    if (err?.issues) return sendError(reply, "Update failed", 400, err.issues);
    if (err.message === "Rule not found") return sendError(reply, err.message, 404);
    return sendError(reply, err.message || "Update failed", 400);
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
    return sendSuccess(reply, result);
  } catch (err: any) {
    if (err.message === "Rule not found") return sendError(reply, err.message, 404);
    return sendError(reply, err.message || "Delete failed", 400);
  }
}
