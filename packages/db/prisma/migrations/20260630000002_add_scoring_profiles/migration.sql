-- Add scoring_profiles and scoring_profile_rules tables
-- Enables database-driven scoring configuration with fallback to TypeScript defaults
-- tenants can have their own profiles, or use global defaults when tenant_id IS NULL

CREATE TABLE IF NOT EXISTS "scoring_profiles" (
    "id" SERIAL PRIMARY KEY,
    "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RISK',
    "base_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thresholds" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "scoring_profiles_tenant_id_idx" ON "scoring_profiles"("tenant_id");
CREATE INDEX IF NOT EXISTS "scoring_profiles_tenant_type_active_idx" ON "scoring_profiles"("tenant_id", "type", "active");

CREATE TABLE IF NOT EXISTS "scoring_profile_rules" (
    "id" SERIAL PRIMARY KEY,
    "profile_id" INTEGER NOT NULL REFERENCES "scoring_profiles"("id") ON DELETE CASCADE,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "score_adjustment" DOUBLE PRECISION NOT NULL,
    "max_adjustment" DOUBLE PRECISION,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB
);

CREATE INDEX IF NOT EXISTS "scoring_profile_rules_profile_id_idx" ON "scoring_profile_rules"("profile_id");

-- ==========================================
-- Seed Default Risk Scoring Profile
-- ==========================================
INSERT INTO "scoring_profiles" ("tenant_id", "name", "type", "base_score", "thresholds")
VALUES (NULL, 'Default Risk Scoring', 'RISK', 20, '{"high": 65, "medium": 35}');

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'dti', '>', '0', 0.3, 30::double precision, 1, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'salary', '>=', '30000', -15, NULL::double precision, 2, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'salary', '>=', '15000', -5, NULL::double precision, 3, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'salary', '>=', '8000', 0, NULL::double precision, 4, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'salary', '>=', '5000', 10, NULL::double precision, 5, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'salary', '<', '5000', 20, NULL::double precision, 6, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'age', 'between', '25,40', -5, NULL::double precision, 7, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'age', '<', '25', 5, NULL::double precision, 8, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'age', '>', '50', 5, NULL::double precision, 9, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'employmentType', '==', 'government', -10, NULL::double precision, 10, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'employmentType', '==', 'listed_private', -5, NULL::double precision, 11, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'employmentType', '==', 'self_employed', 10, NULL::double precision, 12, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'employmentType', '==', 'retired', 5, NULL::double precision, 13, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'iScore', '>=', '700', -15, NULL::double precision, 14, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'iScore', 'between', '600,699', -5, NULL::double precision, 15, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'iScore', 'between', '500,599', 10, NULL::double precision, 16, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'iScore', 'between', '400,499', 20, NULL::double precision, 17, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'iScore', '<', '400', 35, NULL::double precision, 18, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'RISK' AND "tenant_id" IS NULL;

-- ==========================================
-- Seed Default Affordability Scoring Profile
-- ==========================================
INSERT INTO "scoring_profiles" ("tenant_id", "name", "type", "base_score", "thresholds")
VALUES (NULL, 'Default Affordability Scoring', 'AFFORDABILITY', 100, '{"high": 60, "medium": 30}');

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'dti', '>=', '40', -1.5, NULL::double precision, 1, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'AFFORDABILITY' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'riskScore', '>=', '40', -0.5, NULL::double precision, 2, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'AFFORDABILITY' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'salaryTransfer', '==', 'false', -5, NULL::double precision, 3, NULL::jsonb FROM "scoring_profiles" WHERE "type" = 'AFFORDABILITY' AND "tenant_id" IS NULL;

INSERT INTO "scoring_profile_rules" ("profile_id", "field", "operator", "value", "score_adjustment", "max_adjustment", "priority", "conditions")
SELECT id, 'carAge', '>', '3', -5, NULL::double precision, 4, '[{"field":"vehicleCondition","operator":"==","value":"used"}]'::jsonb FROM "scoring_profiles" WHERE "type" = 'AFFORDABILITY' AND "tenant_id" IS NULL;
