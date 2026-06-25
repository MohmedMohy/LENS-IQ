import type { FastifyRequest, FastifyReply } from "fastify";
import { getAuditLogs } from "./service.js";
import { handleResult, handleError } from "../../shared/response.js";

export async function getAuditLogsController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const tenantId = req.tenantId;
        const role = req.tenantRole;
        const userId = req.userId;
        const query = req.query as { page?: string };
        const page = Math.max(1, Number(query.page) || 1);
        const data = await getAuditLogs(tenantId, page, role, userId);
        return handleResult(reply, { data });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to fetch audit logs"));
    }
}
