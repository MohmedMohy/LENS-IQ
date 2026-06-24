import type { FastifyRequest, FastifyReply } from "fastify";
import { createUser, getUsers, getUserById, updateUser, deleteUser, getTeamMembers, updateTeamMember } from "./service.js";
import { createUserSchema, updateUserSchema, updateTeamMemberSchema } from "./schema.js";
import { sendSuccess, sendError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

export async function createUserController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const body = createUserSchema.parse(req.body);
        const result = await createUser(body, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "create", entity: "user", entityId: result.id });
        return sendSuccess(reply, result, 201);
    } catch (err: any) {
        if (err?.issues) return sendError(reply, "Validation failed", 400, err.issues);
        return sendError(reply, err.message || "Failed to create user", 400);
    }
}

export async function getUsersController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const data = await getUsers(tenantId);
        return sendSuccess(reply, data);
    } catch (err: any) {
        return sendError(reply, err.message || "Failed to fetch users", 500);
    }
}

export async function getUserController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const data = await getUserById(id, tenantId);
        return sendSuccess(reply, data);
    } catch (err: any) {
        if (err.message === "User not found") return sendError(reply, err.message, 404);
        return sendError(reply, err.message || "Failed to fetch user", 500);
    }
}

export async function updateUserController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const body = updateUserSchema.parse(req.body);
        const result = await updateUser(id, body, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "update", entity: "user", entityId: id });
        return sendSuccess(reply, result);
    } catch (err: any) {
        if (err?.issues) return sendError(reply, "Validation failed", 400, err.issues);
        if (err.message === "User not found") return sendError(reply, err.message, 404);
        return sendError(reply, err.message || "Failed to update user", 400);
    }
}

export async function deleteUserController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const result = await deleteUser(id, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "delete", entity: "user", entityId: id });
        return sendSuccess(reply, result);
    } catch (err: any) {
        if (err.message === "User not found") return sendError(reply, err.message, 404);
        return sendError(reply, err.message || "Failed to delete user", 400);
    }
}

export async function getTeamController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const role = req.tenantRole;
        const userId = req.userId;
        const data = await getTeamMembers(tenantId, role, userId);
        return sendSuccess(reply, data);
    } catch (err: any) {
        return sendError(reply, err.message || "Failed to fetch team", 500);
    }
}

export async function updateTeamMemberController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const role = req.tenantRole;
        const userId = req.userId;
        const id = Number(req.params.id);
        const body = updateTeamMemberSchema.parse(req.body);
        const result = await updateTeamMember(id, body, tenantId, role, userId);
        logAudit({ tenantId, userId: req.userId, action: "update", entity: "user", entityId: id });
        return sendSuccess(reply, result);
    } catch (err: any) {
        if (err?.issues) return sendError(reply, "Validation failed", 400, err.issues);
        if (err.message === "User not found") return sendError(reply, err.message, 404);
        if (err.message === "Not authorized to update this user") return sendError(reply, err.message, 403);
        return sendError(reply, err.message || "Failed to update team member", 400);
    }
}
