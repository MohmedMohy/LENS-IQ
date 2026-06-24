import type { FastifyRequest, FastifyReply } from "fastify";

export function rbacMiddleware(...allowedRoles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const role = req.tenantRole;
    if (!role || !allowedRoles.includes(role)) {
      return reply.status(403).send({
        success: false,
        message: `Forbidden. Required roles: ${allowedRoles.join(", ")}`,
      });
    }
  };
}
