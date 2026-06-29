-- Refactor Financing Programs Architecture
-- ==========================================
-- Step 1: Create new enums
-- ==========================================
CREATE TYPE "CustomerType" AS ENUM ('salary_transfer', 'employee', 'self_employed');

-- ==========================================
-- Step 2: Create program_banks join table
-- ==========================================
CREATE TABLE "program_banks" (
    "program_id" INTEGER NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "interest_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profit_rate" DOUBLE PRECISION,
    "min_months" INTEGER NOT NULL DEFAULT 12,
    "max_months" INTEGER NOT NULL,
    "min_down_payment_percent" DOUBLE PRECISION NOT NULL,
    "max_down_payment_percent" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "max_finance_amount" DOUBLE PRECISION,
    "admin_fees_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_car_age" INTEGER NOT NULL DEFAULT 0,
    "max_vehicle_price" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "program_banks_pkey" PRIMARY KEY ("program_id", "bank_id")
);

-- Indexes for program_banks
CREATE INDEX "program_banks_program_id_idx" ON "program_banks"("program_id");
CREATE INDEX "program_banks_bank_id_idx" ON "program_banks"("bank_id");

-- Foreign keys for program_banks
ALTER TABLE "program_banks" ADD CONSTRAINT "program_banks_program_id_fkey"
    FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE;
ALTER TABLE "program_banks" ADD CONSTRAINT "program_banks_bank_id_fkey"
    FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE;

-- ==========================================
-- Step 3: Migrate existing program-bank relationships
-- ==========================================
-- For each existing program, create an entry in program_banks
-- using the program's current bank_id and financial terms
INSERT INTO "program_banks" (
    "program_id", "bank_id",
    "interest_rate", "profit_rate",
    "min_months", "max_months",
    "min_down_payment_percent", "max_down_payment_percent",
    "max_finance_amount", "admin_fees_percent",
    "max_car_age", "max_vehicle_price", "active"
)
SELECT
    id, bank_id,
    interest_rate, profit_rate,
    min_months, max_months,
    min_down_payment_percent, max_down_payment_percent,
    max_finance_amount, admin_fees_percent,
    max_car_age, max_vehicle_price, active
FROM "programs";

-- ==========================================
-- Step 4: Add new columns to programs table
-- ==========================================
ALTER TABLE "programs" ADD COLUMN "code" TEXT;
ALTER TABLE "programs" ADD COLUMN "description" TEXT;
ALTER TABLE "programs" ADD COLUMN "customer_types" "CustomerType"[] NOT NULL DEFAULT '{}';
ALTER TABLE "programs" ADD COLUMN "required_documents" JSONB;
ALTER TABLE "programs" ADD COLUMN "default_risk_rules" JSONB;
ALTER TABLE "programs" ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ==========================================
-- Step 5: Remove bank_id from programs
-- ==========================================
ALTER TABLE "programs" DROP CONSTRAINT IF EXISTS "programs_bank_id_fkey";
DROP INDEX IF EXISTS "programs_bank_id_idx";
ALTER TABLE "programs" DROP COLUMN "bank_id";

-- ==========================================
-- Step 6: Add scope and priority to rules
-- ==========================================
ALTER TABLE "rules" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'PROGRAM';
ALTER TABLE "rules" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- ==========================================
-- Step 7: Update Bank relation
-- ==========================================
-- The Bank table already exists and is correct.
-- The relation to Program now goes through program_banks.
-- No DDL changes needed for banks table itself.

-- ==========================================
-- Step 8: Set initial code and customer_types for existing programs
-- ==========================================
-- Try to infer code from existing name patterns
UPDATE "programs" SET "code" = 'SALARY_TRANSFER' WHERE "code" IS NULL AND "salary_transfer_required" = true;
UPDATE "programs" SET "code" = 'EMPLOYEES' WHERE "code" IS NULL AND "salary_transfer_required" = false;
UPDATE "programs" SET "customer_types" = ARRAY['salary_transfer'::"CustomerType"] WHERE "salary_transfer_required" = true AND array_length("customer_types", 1) IS NULL;
UPDATE "programs" SET "customer_types" = ARRAY['employee'::"CustomerType"] WHERE "salary_transfer_required" = false AND array_length("customer_types", 1) IS NULL;
