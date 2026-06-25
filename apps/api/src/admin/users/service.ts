import bcrypt from "bcrypt";
import { db } from "../../db/db.js";
import type { CreateUserInput, UpdateUserInput, UpdateTeamMemberInput } from "./schema.js";

const SALT_ROUNDS = 10;
const MAX_USERS = 7;

export async function createUser(input: CreateUserInput, tenantId: number) {
    const existing = await db.query(
        `SELECT id FROM users WHERE tenant_id = $1 AND email = $2`,
        [tenantId, input.email]
    );
    if (existing.rows[0]) throw new Error("Email already exists for this tenant");

    const countResult = await db.query(
        `SELECT COUNT(*)::int as count FROM users WHERE tenant_id = $1 AND active = true`,
        [tenantId]
    );
    if (countResult.rows[0].count >= MAX_USERS) {
        throw new Error(`User limit reached (${MAX_USERS}). Maximum ${MAX_USERS} users allowed.`);
    }

    const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);

    if (input.manager_id) {
        const managerResult = await db.query(
            `SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role = 'MANAGER'`,
            [input.manager_id, tenantId]
        );
        if (!managerResult.rows[0]) throw new Error("Manager not found or not a MANAGER");
    }

    const result = await db.query(
        `INSERT INTO users (tenant_id, name, email, password_hash, role, manager_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, tenant_id, manager_id, name, email, role, active, created_at`,
        [tenantId, input.name, input.email, password_hash, input.role, input.manager_id || null]
    );

    return result.rows[0];
}

export async function getUsers(tenantId: number) {
    const result = await db.query(
        `SELECT u.id, u.tenant_id, u.manager_id, u.name, u.email, u.role, u.active, u.created_at,
                m.name as manager_name
         FROM users u
         LEFT JOIN users m ON m.id = u.manager_id
         WHERE u.tenant_id = $1
         ORDER BY u.created_at DESC`,
        [tenantId]
    );

    return result.rows;
}

export async function getUserById(id: number, tenantId: number) {
    const result = await db.query(
        `SELECT u.id, u.tenant_id, u.manager_id, u.name, u.email, u.role, u.active, u.created_at,
                m.name as manager_name
         FROM users u
         LEFT JOIN users m ON m.id = u.manager_id
         WHERE u.id = $1 AND u.tenant_id = $2`,
        [id, tenantId]
    );

    if (!result.rows[0]) throw new Error("User not found");
    return result.rows[0];
}

export async function updateUser(id: number, input: UpdateUserInput, tenantId: number) {
    const existing = await db.query(
        `SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
    );
    if (!existing.rows[0]) throw new Error("User not found");

    if (input.email) {
        const duplicate = await db.query(
            `SELECT id FROM users WHERE tenant_id = $1 AND email = $2 AND id != $3`,
            [tenantId, input.email, id]
        );
        if (duplicate.rows[0]) throw new Error("Email already exists for this tenant");
    }

    if (input.manager_id) {
        const managerResult = await db.query(
            `SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role = 'MANAGER'`,
            [input.manager_id, tenantId]
        );
        if (!managerResult.rows[0]) throw new Error("Manager not found or not a MANAGER");
        if (input.manager_id === id) throw new Error("A user cannot be their own manager");
    }

    if (input.role === "MANAGER") {
        await db.query(
            `UPDATE users SET manager_id = NULL WHERE manager_id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
    }

    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (input.name) { sets.push(`name = $${idx++}`); params.push(input.name); }
    if (input.email) { sets.push(`email = $${idx++}`); params.push(input.email); }
    if (input.role) { sets.push(`role = $${idx++}`); params.push(input.role); }
    if (input.active !== undefined) { sets.push(`active = $${idx++}`); params.push(input.active); }
    if (input.manager_id !== undefined) { sets.push(`manager_id = $${idx++}`); params.push(input.manager_id || null); }
    if (input.password) {
        const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);
        sets.push(`password_hash = $${idx++}`);
        params.push(password_hash);
    }

    if (sets.length === 0) throw new Error("No fields to update");

    params.push(id, tenantId);
    const query = `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx++} AND tenant_id = $${idx++} RETURNING id, tenant_id, manager_id, name, email, role, active, created_at`;

    const result = await db.query(query, params);
    return result.rows[0];
}

export async function deleteUser(id: number, tenantId: number) {
    await db.query(
        `UPDATE users SET manager_id = NULL WHERE manager_id = $1 AND tenant_id = $2`,
        [id, tenantId]
    );

    const result = await db.query(
        `DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [id, tenantId]
    );

    if (!result.rows[0]) throw new Error("User not found");
    return { success: true };
}

export async function getTeamMembers(tenantId: number, role?: string, userId?: number) {
    if (role === "MANAGER" && userId) {
        const result = await db.query(
            `SELECT u.id, u.tenant_id, u.manager_id, u.name, u.email, u.role, u.active, u.created_at,
                    m.name as manager_name
             FROM users u
             LEFT JOIN users m ON m.id = u.manager_id
             WHERE u.tenant_id = $1 AND (u.manager_id = $2 OR u.id = $2)
             ORDER BY u.name`,
            [tenantId, userId]
        );
        return result.rows;
    }

    const result = await db.query(
        `SELECT u.id, u.tenant_id, u.manager_id, u.name, u.email, u.role, u.active, u.created_at,
                m.name as manager_name
         FROM users u
         LEFT JOIN users m ON m.id = u.manager_id
         WHERE u.tenant_id = $1
         ORDER BY u.name`,
        [tenantId]
    );
    return result.rows;
}

export async function updateTeamMember(id: number, input: UpdateTeamMemberInput, tenantId: number, role?: string, userId?: number) {
    const existing = await db.query(
        `SELECT id, role, manager_id FROM users WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
    );
    if (!existing.rows[0]) throw new Error("User not found");

    if (role === "MANAGER") {
        const member = existing.rows[0];
        if (member.role === "MANAGER" && member.id !== userId) {
            throw new Error("Not authorized to update this user");
        }
        if (member.manager_id !== userId && member.id !== userId) {
            throw new Error("Not authorized to update this user");
        }
    }

    if (input.email) {
        const duplicate = await db.query(
            `SELECT id FROM users WHERE tenant_id = $1 AND email = $2 AND id != $3`,
            [tenantId, input.email, id]
        );
        if (duplicate.rows[0]) throw new Error("Email already exists for this tenant");
    }

    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (input.name) { sets.push(`name = $${idx++}`); params.push(input.name); }
    if (input.email) { sets.push(`email = $${idx++}`); params.push(input.email); }
    if (input.active !== undefined) { sets.push(`active = $${idx++}`); params.push(input.active); }
    if (input.password) {
        const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);
        sets.push(`password_hash = $${idx++}`);
        params.push(password_hash);
    }

    if (sets.length === 0) throw new Error("No fields to update");

    params.push(id, tenantId);
    const query = `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx++} AND tenant_id = $${idx++} RETURNING id, tenant_id, manager_id, name, email, role, active, created_at`;

    const result = await db.query(query, params);
    return result.rows[0];
}
