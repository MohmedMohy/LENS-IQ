# Lens IQ — Execution Roadmap

> **Generated:** 2026-06-20 (Updated)  
> **Current Score:** 72/100  
> **Production Readiness:** 65/100  

---

## New Analysis Documents (Arabic)

| Document | Description |
|----------|-------------|
| [`AR-ANALYSIS-REPORT.md`](./AR-ANALYSIS-REPORT.md) | Full Arabic architecture analysis — 11 sections covering blockers, implementation plan, file-by-file changes, environment variables, testing, deployment, and MVP readiness |
| [`AR-BLOCKERS-CHECKLIST.md`](./AR-BLOCKERS-CHECKLIST.md) | Arabic blockers checklist — tracks 7 critical, 7 high, and 9 medium blockers to closure |

> **Key finding from analysis:** 10 working days needed across 4 phases to reach 95/100 readiness. Critical path: RBAC → httpOnly cookies → refresh tokens → Prisma migrations. 

---

## Priority Order

1. **Decision Engine** → Done (scoring, rules, pricing, offers)
2. **Approval Score** → Done (approvalProbability 0-99%)
3. **Explainability** → Done (reasons array with impact levels)
4. **Offer Optimizer** → Done (`/optimize` endpoint)
5. **Widget** → Scaffolded (apps/widget, iframe integration)
6. **Dashboard** → MVP exists (admin-dashboard)
7. **Lead Aggregation** → Not started
8. **Communication Automation** → Not started

---

## ✅ Completed Tasks

### Audit & Analysis
- [x] Full codebase audit (62 findings across 3 areas)
- [x] Security audit (CSP, env validation)
- [x] Dependency analysis (missing deps added)
- [x] Build configuration fixed (tsconfig, Dockerfile)

### Infrastructure
- [x] API health check endpoint (`/health`)
- [x] Environment validation at startup
- [x] Content-Security-Policy headers
- [x] Rate limiting (global 100 req/min)
- [x] Graceful shutdown (SIGTERM/SIGINT handlers)
- [x] Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- [x] Global error handler with status code mapping
- [x] CORS with origin whitelist

### Frontend
- [x] ErrorBoundary wrapping app root
- [x] DataTable pagination, search, sorting implemented
- [x] Zustand auth store + localStorage token persistence
- [x] React Router with protected routes

### Engine
- [x] Approval probability scoring (0-99%)
- [x] Offer ranking by affordability + risk + DTI
- [x] Explainability reasons (type, message, impact)
- [x] Offer Optimizer API with suggestions (down payment, duration, program)

### Database
- [x] Prisma schema — 8 proper enums on model fields
- [x] Seed script with sample data (tenants, banks, programs, customers, vehicles, applications)
- [x] Raw `pg` queries for runtime (hybrid approach with Prisma for schema)

### Documentation
- [x] API reference documentation
- [x] Widget integration guide
- [x] Deployment guide
- [x] Audit report

---

## 🚧 Remaining Tasks

### Phase 2 — Auth & Access Control (Estimated: 3 days)

| Task | Priority | Effort | Risk |
|------|----------|--------|------|
| Add RBAC to auth middleware | Critical | 1 day | Auth bypass |
| Replace localStorage JWT with httpOnly cookies | Critical | 1 day | XSS token theft |
| Add brute-force protection on login | High | 0.5 day | Credential brute-force |
| Fix user enumeration (generic "Invalid credentials") | High | 0.5 day | Information leak |
| Add CSP nonce for inline styles | Medium | 0.25 day | CSP bypass |
| Remove API key from login response | Medium | 0.25 day | Credential exposure |

### Phase 3 — Error Handling & UX (Estimated: 4 days)

| Task | Priority | Effort | Risk |
|------|----------|--------|------|
| Add loading skeletons (replace text) | High | 1 day | Poor UX |
| Add individual error boundaries per page | Medium | 1 day | Page crashes |
| Add `.catch()` to remaining async ops | High | 1 day | Unhandled rejections |
| Add confirmation dialogs for deletes | Medium | 0.5 day | Accidental deletes |
| Add unsaved-changes warning on forms | Low | 0.5 day | Data loss |
| Add offline connectivity banner | Medium | 0.5 day | Silent failures |

### Phase 4 — Code Quality (Estimated: 3 days)

| Task | Priority | Effort | Risk |
|------|----------|--------|------|
| Consolidate duplicated form components | Medium | 1 day | Maintenance burden |
| Remove `@lens/shared-types` dead package | Low | 0.25 day | Dead code |
| Add `tenant_id` to Bank, Program, Offer types | High | 0.5 day | Tenant isolation gap |
| Remove `Record<string, unknown>` casts in normalizers | Medium | 1 day | Type unsafety |
| Add `React.memo` + `useCallback` for render optimization | Low | 1 day | Performance |
| Add `useDebounce` hook for search inputs | Low | 0.25 day | Excessive API calls |
| Wire `@lens/db` (Prisma client) into `apps/api` | Medium | 1 day | ORM consistency |

### Phase 5 — Dashboard & Analytics (Estimated: 5 days)

| Task | Priority | Effort | Risk |
|------|----------|--------|------|
| Total applications KPI card | High | 0.5 day | Ops visibility |
| Approval rate with trend chart | High | 1 day | Ops visibility |
| Average qualification time KPI | Medium | 0.5 day | Ops visibility |
| Top financing partner ranking | Medium | 0.5 day | Partner insights |
| Top rejection reasons breakdown | Medium | 1 day | Improvement guidance |
| Export reports (CSV/PDF) | Low | 1 day | Reporting |

### Phase 6 — Widget & Integration (Estimated: 3 days)

| Task | Priority | Effort | Risk |
|------|----------|--------|------|
| Widget state management (loading/error/empty) | High | 0.5 day | Poor UX |
| Widget theming (brand colors, logo) | Medium | 1 day | Brand consistency |
| Widget auto-height resize | Medium | 0.5 day | Layout issues |
| Public apply endpoint for widget | High | 0.5 day | Missing flow |

### Phase 7 — Lead Aggregation (Estimated: 5 days)

| Task | Priority | Effort | Risk |
|------|----------|--------|------|
| Lead capture API | Medium | 1 day | Pipeline visibility |
| Lead status tracking | Medium | 1 day | Pipeline management |
| Lead source attribution | Low | 1 day | Marketing ROI |
| Follow-up reminders | Low | 2 days | Conversion rate |

### Phase 8 — Communication Automation (Estimated: 5 days)

| Task | Priority | Effort | Risk |
|------|----------|--------|------|
| SMS notifications (via Twilio/Vonage) | Low | 2 days | Customer engagement |
| Email notifications | Low | 1 day | Customer engagement |
| Application status webhook | Low | 1 day | CRM sync |
| Approval/rejection templates | Low | 1 day | Communication consistency |

---

## 🧨 Key Risks

1. **No RBAC** — any authenticated user has full admin access (mitigation: Phase 2)
2. **JWT in localStorage** — XSS vulnerability (mitigation: httpOnly cookies in Phase 2)
3. **No refresh tokens** — leaked JWT valid for 7 days (mitigation: Phase 2)
4. **Prisma `db push` in production** — Dockerfile uses `--accept-data-loss` (mitigation: use migrations)
5. **No automated tests** — all changes require manual verification (mitigation: add E2E in Phase 5)
6. **No monitoring/alerting** — production issues detected reactively (mitigation: add Sentry)

---

## Milestones

| Milestone | Target | Deliverables |
|-----------|--------|--------------|
| M1: Secure Auth | Week 1 | RBAC, httpOnly cookies, rate limiting |
| M2: UX Stabilized | Week 2 | Loading skeletons, error boundaries, retry logic |
| M3: Dashboard V2 | Week 3 | KPI dashboard, approval trends, rejection analysis |
| M4: Widget Launch | Week 4 | Production widget, theming, event bus |
| M5: Testing | Week 5 | API tests, E2E tests, CI pipeline |
| M6: Lead Automation | Week 6-7 | Lead capture, status tracking, notifications |
| M7: Production Go-Live | Week 8 | Security audit, load testing, monitoring |

---

## Effort Summary

| Phase | Days | Critical | High | Medium | Low |
|-------|------|----------|------|--------|-----|
| P2: Auth & Access | 3 | 2 | 2 | 1 | — |
| P3: Error Handling | 4 | — | 2 | 4 | 1 |
| P4: Code Quality | 3 | — | 1 | 4 | 3 |
| P5: Dashboard | 5 | — | 2 | 3 | 1 |
| P6: Widget | 3 | — | 3 | 1 | — |
| P7: Lead Aggregation | 5 | — | — | 3 | 2 |
| P8: Communication | 5 | — | — | — | 4 |
| **Total** | **28** | **2** | **10** | **16** | **11** |
