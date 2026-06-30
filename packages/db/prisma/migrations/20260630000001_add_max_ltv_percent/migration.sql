-- Add max_ltv_percent to programs and program_banks
-- Allows per-program and per-bank control over maximum Loan-To-Value ratio
-- Falls back to hardcoded defaults (80% new / 70% used) when NULL

ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "max_ltv_percent" DOUBLE PRECISION;

ALTER TABLE "program_banks" ADD COLUMN IF NOT EXISTS "max_ltv_percent" DOUBLE PRECISION;
