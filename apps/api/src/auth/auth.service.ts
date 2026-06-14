// src/auth/auth.service.ts

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import "dotenv/config";
import { db } from "../db/db.js";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

const JWT_SECRET: string = getJwtSecret();
const SALT_ROUNDS = 10;

/* =========================
   REGISTER
========================= */
export async function registerTenant(
    name: string,
    email: string,
    password: string
) {
    // تأكد مش موجود قبل كده
    const existing = await db.query(
        `SELECT id FROM tenants WHERE email = $1`,
        [email]
    );
    if (existing.rows[0]) throw new Error("Email already registered");

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const api_key = crypto.randomBytes(32).toString("hex");

    const result = await db.query(
        `INSERT INTO tenants (name, email, password_hash, api_key)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, api_key, created_at`,
        [name, email, password_hash, api_key]
    );

    return result.rows[0];
}

/* =========================
   LOGIN
========================= */
export async function loginTenant(email: string, password: string) {
    const result = await db.query(
        `SELECT * FROM tenants WHERE email = $1 AND active = true`,
        [email]
    );

    const tenant = result.rows[0];
    if (!tenant) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, tenant.password_hash);
    if (!valid) throw new Error("Invalid credentials");

    const token = jwt.sign(
        { tenantId: tenant.id, email: tenant.email },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return {
        token,
        tenant: {
            id: tenant.id,
            name: tenant.name,
            email: tenant.email,
            api_key: tenant.api_key,
        },
    };
}

/* =========================
   VERIFY TOKEN
========================= */
export function verifyToken(token: string): { tenantId: number; email: string } {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload !== "object" || payload === null || !("tenantId" in payload)) {
        throw new Error("Invalid token payload");
    }
    return payload as { tenantId: number; email: string };
}

/* =========================
   GET TENANT BY ID
========================= */
export async function getTenantById(tenantId: number) {
    const result = await db.query(
        `SELECT id, name, email, api_key, active, created_at 
     FROM tenants WHERE id = $1`,
        [tenantId]
    );

    if (!result.rows[0]) throw new Error("Tenant not found");

    return result.rows[0];
}
/* =========================
CHANGE PASSWORD
========================= */
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

/* =========================
   REGENERATE API KEY
========================= */
export async function regenerateApiKey(tenantId: number) {
    const api_key = crypto.randomBytes(32).toString("hex");

    const result = await db.query(
        `UPDATE tenants
         SET api_key = $1
         WHERE id = $2
         RETURNING id, name, email, api_key`,
        [api_key, tenantId]
    );

    if (!result.rows[0]) throw new Error("Tenant not found");
    return result.rows[0];
}
/* =========================
   UPDATE TENANT PROFILE
========================= */
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
         RETURNING id, name, email, api_key, created_at`,
        [name.trim(), tenantId]
    );

    if (!result.rows[0]) throw new Error("Tenant not found");

    return result.rows[0];
}
