import bcrypt from "bcrypt";
import crypto from "crypto";
import "dotenv/config";
import { db } from "../db/db.js";
import {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashToken,
} from "./token.service.js";

const SALT_ROUNDS = 10;

function hashApiKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
}

function maskApiKey(key: string): string {
    if (key.length <= 8) return "***";
    return key.slice(0, 8) + "..." + key.slice(-4);
}

export async function registerTenant(
    name: string,
    email: string,
    password: string
) {
    const existing = await db.query(
        `SELECT id FROM tenants WHERE email = $1`,
        [email]
    );
    if (existing.rows[0]) throw new Error("Email already registered");

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const api_key = crypto.randomBytes(32).toString("hex");
    const api_key_hash = hashApiKey(api_key);

    const result = await db.query(
        `INSERT INTO tenants (name, email, password_hash, api_key_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
        [name, email, password_hash, api_key_hash]
    );

    return { ...result.rows[0], api_key };
}

export async function loginTenant(email: string, password: string) {
    const result = await db.query(
        `SELECT id, name, email, role, password_hash FROM tenants WHERE email = $1 AND active = true`,
        [email]
    );

    const tenant = result.rows[0];
    if (tenant) {
        const valid = await bcrypt.compare(password, tenant.password_hash);
        if (!valid) throw new Error("Invalid credentials");

        const accessToken = signAccessToken({
            tenantId: tenant.id,
            email: tenant.email,
            role: tenant.role,
            userType: "tenant",
        });

        const { token: refreshToken, jti } = signRefreshToken(tenant.id);
        const tokenHash = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await db.query(
            `INSERT INTO refresh_tokens (tenant_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
            [tenant.id, tokenHash, expiresAt]
        );

        return {
            accessToken,
            refreshToken,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                email: tenant.email,
                role: tenant.role,
            },
        };
    }

    const userResult = await db.query(
        `SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.password_hash, t.name as tenant_name
         FROM users u JOIN tenants t ON t.id = u.tenant_id
         WHERE u.email = $1 AND u.active = true AND t.active = true`,
        [email]
    );

    const user = userResult.rows[0];
    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Invalid credentials");

    const accessToken = signAccessToken({
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role,
        userId: user.id,
        userType: "user",
    });

    const { token: refreshToken, jti } = signRefreshToken(user.tenant_id, user.id);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
        `INSERT INTO refresh_tokens (tenant_id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [user.tenant_id, user.id, tokenHash, expiresAt]
    );

    return {
        accessToken,
        refreshToken,
        tenant: {
            id: user.tenant_id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
}

export async function refreshTokens(token: string) {
    const payload = verifyRefreshToken(token);
    const tokenHash = hashToken(token);

    const result = await db.query(
        `SELECT id, tenant_id, user_id FROM refresh_tokens
     WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
    );

    const stored = result.rows[0];
    if (!stored) throw new Error("Invalid or expired refresh token");

    await db.query(`DELETE FROM refresh_tokens WHERE id = $1`, [stored.id]);

    if (stored.user_id) {
        const userResult = await db.query(
            `SELECT u.id, u.tenant_id, u.name, u.email, u.role
             FROM users u JOIN tenants t ON t.id = u.tenant_id
             WHERE u.id = $1 AND u.active = true AND t.active = true`,
            [stored.user_id]
        );

        const user = userResult.rows[0];
        if (!user) throw new Error("User not found or inactive");

        const accessToken = signAccessToken({
            tenantId: user.tenant_id,
            email: user.email,
            role: user.role,
            userId: user.id,
            userType: "user",
        });

        const { token: newRefreshToken, jti } = signRefreshToken(user.tenant_id, user.id);
        const newHash = hashToken(newRefreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await db.query(
            `INSERT INTO refresh_tokens (tenant_id, user_id, token_hash, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [user.tenant_id, user.id, newHash, expiresAt]
        );

        return {
            accessToken,
            refreshToken: newRefreshToken,
            tenant: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    const tenantResult = await db.query(
        `SELECT id, name, email, role FROM tenants WHERE id = $1 AND active = true`,
        [stored.tenant_id]
    );

    const tenant = tenantResult.rows[0];
    if (!tenant) throw new Error("Tenant not found or inactive");

    const accessToken = signAccessToken({
        tenantId: tenant.id,
        email: tenant.email,
        role: tenant.role,
        userType: "tenant",
    });

    const { token: newRefreshToken, jti } = signRefreshToken(tenant.id);
    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
        `INSERT INTO refresh_tokens (tenant_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [tenant.id, newHash, expiresAt]
    );

    return {
        accessToken,
        refreshToken: newRefreshToken,
        tenant: {
            id: tenant.id,
            name: tenant.name,
            email: tenant.email,
            role: tenant.role,
        },
    };
}

export async function logout(tenantId: number, refreshToken?: string, userId?: number) {
    if (refreshToken) {
        const tokenHash = hashToken(refreshToken);
        if (userId) {
            await db.query(
                `DELETE FROM refresh_tokens WHERE token_hash = $1 AND tenant_id = $2 AND user_id = $3`,
                [tokenHash, tenantId, userId]
            );
        } else {
            await db.query(
                `DELETE FROM refresh_tokens WHERE token_hash = $1 AND tenant_id = $2`,
                [tokenHash, tenantId]
            );
        }
    } else {
        if (userId) {
            await db.query(
                `DELETE FROM refresh_tokens WHERE tenant_id = $1 AND user_id = $2`,
                [tenantId, userId]
            );
        } else {
            await db.query(
                `DELETE FROM refresh_tokens WHERE tenant_id = $1`,
                [tenantId]
            );
        }
    }
}

export function verifyToken(token: string) {
    return verifyAccessToken(token);
}

export async function getTenantById(tenantId: number) {
    const result = await db.query(
        `SELECT id, name, email, role, active, max_users, created_at
     FROM tenants WHERE id = $1`,
        [tenantId]
    );

    if (!result.rows[0]) throw new Error("Tenant not found");

    return result.rows[0];
}

export async function getUserById(userId: number, tenantId: number) {
    const result = await db.query(
        `SELECT id, name, email, role, active, created_at
         FROM users WHERE id = $1 AND tenant_id = $2`,
        [userId, tenantId]
    );

    if (!result.rows[0]) throw new Error("User not found");
    return result.rows[0];
}

export async function changeTenantPassword(
    tenantId: number,
    currentPassword: string,
    newPassword: string
) {
    const result = await db.query(
        `SELECT * FROM tenants WHERE id = $1`,
        [tenantId]
    );

    const tenant = result.rows[0];
    if (!tenant) throw new Error("Tenant not found");

    const valid = await bcrypt.compare(currentPassword, tenant.password_hash);
    if (!valid) throw new Error("Current password is incorrect");

    if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters");
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.query(
        `UPDATE tenants SET password_hash = $1 WHERE id = $2`,
        [password_hash, tenantId]
    );

    return { success: true };
}

export async function regenerateApiKey(tenantId: number) {
    const api_key = crypto.randomBytes(32).toString("hex");
    const api_key_hash = hashApiKey(api_key);

    const result = await db.query(
        `UPDATE tenants
     SET api_key_hash = $1
     WHERE id = $2
     RETURNING id, name, email`,
        [api_key_hash, tenantId]
    );

    if (!result.rows[0]) throw new Error("Tenant not found");
    return { ...result.rows[0], api_key };
}

export async function updateTenantProfile(
    tenantId: number,
    name: string
) {
    if (!name || name.trim().length < 2) {
        throw new Error("Name must be at least 2 characters");
    }

    const result = await db.query(
        `UPDATE tenants
     SET name = $1
     WHERE id = $2
     RETURNING id, name, email, role, created_at`,
        [name.trim(), tenantId]
    );

    if (!result.rows[0]) throw new Error("Tenant not found");

    return result.rows[0];
}
