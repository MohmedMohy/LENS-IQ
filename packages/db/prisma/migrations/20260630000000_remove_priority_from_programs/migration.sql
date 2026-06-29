-- Remove priority column from programs table (no longer needed,
-- the comparison engine ranks offers dynamically per customer)
ALTER TABLE "programs" DROP COLUMN IF EXISTS "priority";

-- Ensure scope and priority exist on rules table (fix missing migration)
ALTER TABLE "rules" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'PROGRAM';
ALTER TABLE "rules" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;
