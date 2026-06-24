import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    tenantId: number;
    tenantRole: string;
    userId?: number;
    userType?: "tenant" | "user";
  }
}
