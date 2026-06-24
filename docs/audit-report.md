# Car1 Fintech / Lens IQ — Full Platform Audit Report

> **Date:** 2026-06-20 (Updated)  
> **Stack:** Fastify 5 + raw `pg` + Prisma (schema only) + React 19 (Vite) + Turborepo

---

## Related Documents

| Document | Description |
|----------|-------------|
| `AR-ANALYSIS-REPORT.md` | Full Arabic architecture analysis with blockers, plan, and readiness report |
| `AR-BLOCKERS-CHECKLIST.md` | Arabic blockers checklist with status tracking |

---

## Executive Summary

| Area | Score | Critical | High | Medium | Low |
|------|-------|----------|------|--------|-----|
| API Backend (`apps/api`) | 7/10 | 0 | 4 | 6 | 3 |
| Admin Dashboard (`apps/admin-dashboard`) | 6/10 | 1 | 5 | 10 | 5 |
| Shared Packages (`packages/*`) | 6/10 | 1 | 3 | 3 | 3 |
| **Total** | **6.3/10** | **2** | **12** | **19** | **11** |

**Phase 1 fixes applied:** Security headers, ErrorBoundary, Prisma enums, env validation, rate limiting, health check, CORS, graceful shutdown, global error handler, DataTable pagination.

**Top remaining blockers:**
1. No role-based access control (any authenticated user = full admin)
2. JWT stored in localStorage (XSS-vulnerable)
3. No refresh token mechanism

---

## 1. Architecture Overview

```
car1-fintech/
├── apps/
│   ├── api/                    # Fastify 5 TypeScript API
│   │   └── src/
│   │       ├── admin/          # Admin CRUD (banks, programs, rules, customers, vehicles, applications)
│   │       ├── auth/           # JWT/API key auth middleware, routes, service
│   │       ├── cli/            # CLI fixtures, runner
│   │       ├── db/             # pg Pool setup (raw SQL)
│   │       ├── engine/         # Lending engine (scoring, rules, pricing, offers, evaluation)
│   │       ├── mappers/        # DTO mappers
│   │       ├── routes/         # Evaluate, optimize, public apply
│   │       ├── services/       # Business logic (getApplication, getPrograms, getRules)
│   │       ├── shared/         # Types, response helpers, env validation
│   │       └── server.ts       # Fastify server setup
│   ├── admin-dashboard/        # React 19 + Vite 8 admin SPA
│   │   └── src/
│   │       ├── api/            # Axios HTTP client
│   │       ├── components/     # UI components + layout
│   │       ├── config/         # Env config
│   │       ├── features/       # Feature modules (auth, banks, programs, etc.)
│   │       ├── lib/            # Schemas, utils, query keys
│   │       ├── router/         # React Router setup
│   │       ├── store/          # Zustand auth store
│   │       └── types/          # App-specific types
│   └── widget/                 # React + Vite embeddable widget
├── packages/
│   ├── config/                 # Env-derived runtime config
│   ├── db/                     # Prisma schema + client + seed
│   ├── shared-types/           # Re-export layer (dead weight)
│   ├── types/                  # Shared TypeScript interfaces
│   ├── ui/                     # Empty package (scaffolded)
│   └── utils/                  # Utilities (cn, clamp, format)
├── Dockerfile                  # Multi-stage production build
├── railway.json                # Railway deployment config
├── turbo.json                  # Turborepo config
└── package.json                # npm workspaces root
```

---

## 2. Backend (apps/api) — Findings

### 2.1 Critical
None currently. All previously identified critical issues have been remediated.

### 2.2 High
| # | File | Line | Issue |
|---|------|------|-------|
| B-H1 | `apps/api/src/auth/auth.middleware.ts` | 20-29 | **No RBAC** — any authenticated tenant is a full admin |
| B-H2 | `apps/api/src/auth/auth.routes.ts` | 49 | **No brute-force / login rate limiting** beyond global 100/min |
| B-H3 | `apps/api/src/auth/auth.service.ts` | 33 | **User enumeration via registration** — returns "Email already registered" |
| B-H4 | `apps/api/src/auth/auth.service.ts` | 63-67 | **JWT expires in 7 days with no refresh/revocation** |

### 2.3 Medium / Low
| # | File | Line | Issue | Severity |
|---|------|------|-------|----------|
| B-M1 | `apps/api/src/routes/evaluate.ts` | — | No input validation on evaluate body (relies on DB lookup) | Medium |
| B-M2 | `apps/api/src/services/getApplication.ts` | — | No try/catch on some DB queries | Medium |
| B-M3 | `apps/api/src/engine/**/*.ts` | — | Limited error handling — bare throws in pipeline | Medium |
| B-M4 | `apps/api/src/server.ts` | — | No request ID / correlation ID middleware | Low |
| B-M5 | `apps/api/src/` | — | No test files found | Low |
| B-M6 | `apps/api/src/auth/auth.service.ts` | 69-77 | API key returned in login response | Medium |

---

## 3. Admin Dashboard (apps/admin-dashboard) — Findings

### 3.1 Critical
| # | File | Line | Issue |
|---|------|------|-------|
| F-C1 | `src/store/auth.store.ts` | 23-35 | **JWT stored in `localStorage`** — XSS-vulnerable, no httpOnly cookie |

### 3.2 High
| # | File | Line | Issue |
|---|------|------|-------|
| F-H1 | `src/api/client.ts` | — | No CSRF protection on API calls |
| F-H2 | `src/api/client.ts` | — | Request errors logged to console (info leak) |
| F-H3 | Multiple feature pages | — | Unhandled promise rejections — no `.catch()` on some async ops |
| F-H4 | All pages | — | No loading skeletons, just text placeholders |
| F-H5 | `src/router/app-router.tsx` | — | No `React.lazy()` or Suspense — all pages eagerly loaded |

### 3.3 Medium / Low
| # | File | Issue | Severity |
|---|------|-------|----------|
| F-M1 | Multiple files | Duplicated form field components | Medium |
| F-M2 | `src/lib/schemas.ts` | Schema field `max_age` vs domain type `max_customer_age` mismatch | Medium |
| F-M3 | `src/components/layout/Sidebar.tsx` | Direct DOM mutation (`document.body.style.overflow`) | Medium |
| F-M4 | — | No `React.memo` or `useCallback` anywhere | Medium |
| F-M5 | Various pages | Array index used as React key | Medium |
| F-M6 | `src/features/apply/pages/ApplyPage.tsx` | No CAPTCHA on public application form | Medium |
| F-M7 | — | No `beforeunload` unsaved-changes warning on forms | Low |
| F-M8 | `src/index.css` | No CSS reset | Low |
| F-M9 | `src/features/evaluate/pages/EvaluatePage.tsx` | Inefficient Promise.all in dashboard data fetch | Medium |
| F-M10 | Empty UI dirs | badge/, button/, empty-state/, input/, loading/ stub directories remain | Low |

---

## 4. Shared Packages (packages/*) — Findings

### 4.1 Critical
| # | File | Issue |
|---|------|-------|
| P-C1 | `apps/api/package.json` | **No `@lens/*` packages declared as dependencies** — API imports raw `pg` directly, ignoring shared Prisma client |

### 4.2 High
| # | File | Issue |
|---|------|-------|
| P-H1 | `packages/types/src/bank.ts` | `CreateBankPayload` breaks established pattern |
| P-H2 | `packages/types/*` vs `schema.prisma` | Duplicated types — no single source of truth |
| P-H3 | `packages/shared-types/` | Unnecessary indirection layer — re-exports everything from `@lens/types` with zero consumers |

### 4.3 Medium / Low
| # | File | Issue |
|---|------|-------|
| P-M1 | `packages/ui/` | Empty package with no components |
| P-M2 | `packages/types/src/offer.ts` | camelCase vs snake_case inconsistency |
| P-M3 | `bank.ts`, `program.ts`, `offer.ts` | `tenant_id` missing from TypeScript interfaces |

---

## 5. Security Summary

| Finding | Severity | Status |
|---------|----------|--------|
| No RBAC (any tenant = admin) | **Critical** | ✅ Fixed — Role enum + rbac.middleware.ts |
| JWT in localStorage | **Critical** | ✅ Fixed — httpOnly cookies + refresh token rotation |
| No error boundary on React app | ✅ Fixed | |
| CSP header added | ✅ Fixed | |
| HSTS + X-Frame-Options + X-Content-Type-Options | ✅ Fixed | |
| Rate limiting (100 req/min) | ✅ Fixed | |
| Global error handler (no stack leak) | ✅ Fixed | |
| Graceful shutdown (SIGTERM/SIGINT) | ✅ Fixed | |
| CORS with origin whitelist | ✅ Fixed | |
| Health check endpoint | ✅ Fixed | |
| User enumeration via registration | **High** | ✅ Fixed — generic "Invalid credentials" |
| API key leaked in login response | **Medium** | ✅ Fixed — removed from login response |
| JWT 7-day expiry with no refresh | **High** | ✅ Fixed — 15min access + 7d refresh with rotation |
| No CSRF protection | **High** | ❌ Open (mitigated by SameSite cookies) |
| No brute-force rate limiting on login | **High** | ✅ Fixed — 5 req / 15 min on /auth/login |
| `@lens/*` packages not wired into API | **High** | ❌ Open |

---

## 6. Performance Summary

| Metric | Status | Details |
|--------|--------|---------|
| Code splitting | ❌ | No `React.lazy` or Suspense |
| Memoization | ❌ | No `React.memo` or `useCallback` |
| Pagination | ✅ | DataTable supports pagination, search, and sorting |
| Loading states | ⚠️ | Text placeholders, no skeletons |
| Bundle optimization | ⚠️ | No code splitting, SVGs inline |
| N+1 queries | ⚠️ | Rule fetch per program in dashboard |
| Debounced search | ❌ | Search fires on every keystroke |
| DB queries | ✅ | Raw SQL with parameterized queries (no ORM overhead at runtime) |

---

## 7. Roadmap

### Phase 1 — Security & Stability ✅
- [x] 1a: `.env` already in `.gitignore` — verified
- [x] 1b: Added security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [x] 1c: Added missing deps to packages (bcrypt, clsx, tailwind-merge)
- [x] 1d: Wrapped React app root in ErrorBoundary
- [x] 1e: Added health check endpoint (`GET /health`)
- [x] 1f: Added global rate limiting (100 req/min)
- [x] 1g: Added CORS with origin whitelist
- [x] 1h: Added graceful shutdown handlers
- [x] 1i: Added global error handler (no stack leak)
- [x] 1j: Added env validation at startup
- [x] 1k: Fixed Prisma schema — model fields use proper enums
- [x] 1l: Build passes (`npm run build` succeeds)
- [x] 1m: DataTable pagination, search, sorting implemented

### Phase 2 — Auth & Access Control ✅ (Completed 2026-06-20)
- [x] 2a: Add RBAC to auth middleware (Role enum + rbac.middleware.ts)
- [x] 2b: Replace localStorage JWT with httpOnly cookie + refresh token rotation
- [x] 2c: Add brute-force rate limiting on login (5 req / 15 min)
- [x] 2d: Fix user enumeration (return generic "Invalid credentials" always)
- [x] 2e: Remove API key from login response
- [ ] 2f: Add CSP nonce for inline scripts (deferred)

### Phase 3 — Error Handling & UX ✅ (Completed 2026-06-20)
- [x] 3a: Add loading skeletons — Skeleton, TableSkeleton, CardSkeleton, StatsSkeleton
- [x] 3b: Add `.catch()` handlers to remaining async operations (previously done)
- [x] 3c: Add confirmation dialogs — extracted inline dialog to reusable ConfirmDialog component
- [ ] 3d: Add unsaved-changes warning on forms (deferred)
- [ ] 3e: Add offline connectivity banner (deferred)
- [ ] 3d: Add unsaved-changes warning on forms
- [ ] 3e: Add offline connectivity banner

### Phase 4 — Code Quality & Maintainability
- [ ] 4a: Consolidate duplicated form components
- [ ] 4b: Remove `@lens/shared-types` dead package
- [ ] 4c: Add `tenant_id` to Bank, Program, Offer types
- [ ] 4d: Remove `Record<string, unknown>` type casts in normalizers
- [ ] 4e: Add `React.memo` + `useCallback` for render optimization
- [ ] 4f: Add `useDebounce` hook for search inputs
- [ ] 4g: Wire `@lens/db` Prisma client into `apps/api`

### Phase 5 — Testing & CI
- [ ] 5a: Add unit tests for lending engine
- [ ] 5b: Add API integration tests
- [ ] 5c: Add E2E tests for admin dashboard
- [ ] 5d: Add CI pipeline with lint → typecheck → test → build
