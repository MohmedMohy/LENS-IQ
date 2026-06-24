-- Create Role enum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'SALES_AGENT');

-- Add role column to tenants table
ALTER TABLE "tenants" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'SALES_AGENT';

-- Set existing tenant to ADMIN
UPDATE "tenants" SET "role" = 'ADMIN' WHERE "email" = 'admin@lens-iq.com';

-- Create refresh_tokens table
CREATE TABLE "refresh_tokens" (
    "id" SERIAL PRIMARY KEY,
    "tenant_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE INDEX "refresh_tokens_tenant_id_idx" ON "refresh_tokens"("tenant_id");
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");
