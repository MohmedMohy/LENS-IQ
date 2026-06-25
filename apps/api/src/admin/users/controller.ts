import type { FastifyRequest, FastifyReply } from "fastify";
import { createUser, getUsers, getUserById, updateUser, deleteUser, getTeamMembers, updateTeamMember } from "./service.js";
import { createUserSchema, updateUserSchema, updateTeamMemberSchema } from "./schema.js";
import { handleResult, handleError } from "../../shared/response.js";
import { logAudit } from "../../shared/audit.service.js";

export async function createUserController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const body = createUserSchema.parse(req.body);
        const result = await createUser(body, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "create", entity: "user", entityId: result.id });
        return handleResult(reply, { data: result, statusCode: 201 });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to create user"));
    }
}

export async function getUsersController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const data = await getUsers(tenantId);
        return handleResult(reply, { data });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to fetch users"));
    }
}

export async function getUserController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const data = await getUserById(id, tenantId);
        return handleResult(reply, { data });
    } catch (err) {
        const e = handleError(err, "User not found");
        if (e.error === "User not found") e.statusCode = 404;
        return handleResult(reply, e);
    }
}

export async function updateUserController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const body = updateUserSchema.parse(req.body);
        const result = await updateUser(id, body, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "update", entity: "user", entityId: id });
        return handleResult(reply, { data: result });
    } catch (err) {
        const e = handleError(err, "Failed to update user");
        if (e.error === "User not found") e.statusCode = 404;
        return handleResult(reply, e);
    }
}

export async function deleteUserController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const id = Number(req.params.id);
        const result = await deleteUser(id, tenantId);
        logAudit({ tenantId, userId: req.userId, action: "delete", entity: "user", entityId: id });
        return handleResult(reply, { data: result });
    } catch (err) {
        const e = handleError(err, "Failed to delete user");
        if (e.error === "User not found") e.statusCode = 404;
        return handleResult(reply, e);
    }
}

export async function getTeamController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const tenantId = req.tenantId;
        const role = req.tenantRole;
        const userId = req.userId;
        const data = await getTeamMembers(tenantId, role, userId);
        return handleResult(reply, { data });
    } catch (err) {
        return handleResult(reply, handleError(err, "Failed to fetch team"));
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
        return handleResult(reply, { data: result });
    } catch (err) {
        const e = handleError(err, "Failed to update team member");
        if (e.error === "User not found") e.statusCode = 404;
        if (e.error === "Not authorized to update this user") e.statusCode = 403;
        return handleResult(reply, e);
    }
}
