import jwt from "jsonwebtoken";
import crypto from "crypto";

function getSecret(name: string): string {
  const secret = process.env[name];
  if (!secret) throw new Error(`${name} environment variable is required`);
  return secret;
}

function getAccessSecret(): string {
  return getSecret("JWT_SECRET");
}

function getRefreshSecret(): string {
  return getSecret("REFRESH_TOKEN_SECRET");
}

export interface AccessTokenPayload {
  tenantId: number;
  email: string;
  role: string;
  userId?: number;
  userType?: "tenant" | "user";
}

export interface RefreshTokenPayload {
  tenantId: number;
  userId?: number;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
  return jwt.sign(payload, getAccessSecret(), { expiresIn } as jwt.SignOptions);
}

export function signRefreshToken(tenantId: number, userId?: number): { token: string; jti: string } {
  const jti = crypto.randomBytes(16).toString("hex");
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  const payload: RefreshTokenPayload = { tenantId, jti };
  if (userId) payload.userId = userId;
  const token = jwt.sign(payload, getRefreshSecret(), { expiresIn } as jwt.SignOptions);
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, getAccessSecret());
  if (typeof payload !== "object" || payload === null || !("tenantId" in payload)) {
    throw new Error("Invalid access token payload");
  }
  return payload as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, getRefreshSecret());
  if (typeof payload !== "object" || payload === null || !("jti" in payload)) {
    throw new Error("Invalid refresh token payload");
  }
  return payload as RefreshTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
