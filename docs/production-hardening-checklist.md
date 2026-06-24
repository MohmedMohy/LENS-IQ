# Production Hardening Checklist — Lens IQ SaaS

## Phase 1 — Security Hardening

### 1.1 Secrets Validation `✓`
- [x] `JWT_SECRET` validated (min 64 hex chars, rejects weak patterns)
- [x] `REFRESH_TOKEN_SECRET` validated (min 64 hex chars, rejects weak patterns)
- [x] `COOKIE_SECRET` validated when set, warns when missing
- [x] JWT_SECRET != REFRESH_TOKEN_SECRET enforced
- [x] Weak pattern detection: `change-me`, `secret`, `password`, `123456`, `qwerty`, `default`

### 1.2 API Key Security `✓`
- [x] API keys generated with `crypto.randomBytes(32)` (256-bit)
- [x] Only SHA-256 hash stored in DB (`api_key_hash` column)
- [x] Plain key returned once on creation / regeneration only
- [x] Lookup queries hash incoming key before comparison
- [x] Seed generates proper random key (no hardcoded test keys)

### 1.3 Sensitive Data Protection `✓`
- [x] `ENCRYPTION_KEY` env var (64 hex chars, AES-256-GCM)
- [x] `national_id` encrypted at rest (via `shared/crypto.service.ts`)
- [x] `phone` encrypted at rest (via `shared/crypto.service.ts`)
- [x] Transparent encrypt-on-write / decrypt-on-read in customer service
- [x] Decryption with fallback for existing plaintext data
- [x] `mask()` utility for log/response masking of PII

### 1.4 Audit Logging `✓`
- [x] `audit_logs` table added to Prisma schema
- [x] `shared/audit.service.ts` with `logAudit()` helper
- [x] Audit hooks on: register, login, password change, API key regenerate
- [x] Audit hooks on: customer create, update, delete
- [x] Captures: tenant_id, user_id, action, entity, entity_id, details, timestamp

### 1.5 RBAC (pre-existing) `✓`
- [x] Role-based middleware (`ADMIN`, `MANAGER`, `SALES_AGENT`)
- [x] JWT payload includes `role` field
- [x] Dual auth (Bearer token + httpOnly cookie + API key)

## Phase 2 — Testing (pending)

## Phase 3 — Observability (pending)

## Phase 4 — DevOps (pending)

## Phase 5 — Database (pending)

## Phase 6 — Documentation (pending)
