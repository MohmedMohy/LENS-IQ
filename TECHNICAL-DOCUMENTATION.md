# Technical Documentation — Lens IQ
## Developer Reference Guide

> **For developers and technical teams only. Not for sales or marketing use.**
>
> Language: English | Version: 1.0 | Stack: Fastify 5 + React 19 + PostgreSQL + TypeScript

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Engine — Decision Pipeline](#6-engine--decision-pipeline)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Security](#8-security)
9. [Widget Integration](#9-widget-integration)
10. [Deployment](#10-deployment)
11. [Configuration](#11-configuration)

---

## 1 | Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Lens IQ Architecture                        │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────────┐    │
│  │  Dealership  │    │  Public      │    │  Internal Admin     │    │
│  │  CRM         │    │  Customer    │    │  Dashboard          │    │
│  │  (Widget)    │    │  (Apply)     │    │  (React SPA)        │    │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬──────────┘    │
│         │                   │                       │               │
│         │ Widget iframe     │ Public API            │ Admin API     │
│         ▼                   ▼                       ▼               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Fastify 5 REST API (apps/api)               │   │
│  │                                                              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐   │   │
│  │  │ Auth    │  │ Admin   │  │ Engine  │  │ Dashboard    │   │   │
│  │  │ Module  │  │ CRUD    │  │ Pipeline│  │ Stats        │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └──────────────┘   │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL + pg Pool (raw SQL)                    │   │
│  │              Prisma (schema management only)                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Raw SQL via pg Pool** | Prisma was creating connection pool issues in production. Raw SQL with parameterized queries gives full control. |
| **Prisma only for schema** | Used for migrations, seeding, and type generation. Runtime queries use `pg` directly. |
| **Turborepo monorepo** | Shared types, utils, and config across API, dashboard, and widget. |
| **Fastify 5** | High performance, schema validation via Zod, plugin architecture. |
| **Multi-tenant (row-level)** | All queries filtered by `tenant_id`. No shared data between tenants. |

---

## 2 | Tech Stack

### Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20+ LTS |
| Framework | Fastify | 5.x |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 15+ |
| Query | `pg` Pool (raw SQL) | ^8 |
| Schema Mgmt | Prisma | 5.x |
| Validation | Zod | 4.x |
| Auth | JWT + bcrypt + refresh tokens | — |
| Logging | Pino | 8.x |
| Encryption | Node crypto (AES-256-GCM) | Built-in |

### Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 19 |
| Build | Vite | 8 |
| Routing | React Router | 7 |
| State | TanStack React Query + Zustand | — |
| Styling | Tailwind CSS 4 + MUI 9 | — |
| i18n | i18next + react-i18next | — |
| Forms | react-hook-form + @hookform/resolvers | — |
| Charts | MUI X Charts | — |

### Infrastructure

| Component | Technology |
|-----------|------------|
| Containerization | Docker (multi-stage build) |
| Deployment | Railway |
| Monorepo | npm workspaces + Turborepo |

---

## 3 | Project Structure

```
car1-fintech/
├── apps/
│   ├── api/                         # Fastify 5 REST API
│   │   └── src/
│   │       ├── routes/              # Route handlers
│   │       │   ├── auth/            # Login, register, refresh, logout
│   │       │   ├── admin/           # CRUD: banks, programs, rules, customers, vehicles, applications, users
│   │       │   ├── evaluate.ts      # Credit evaluation endpoint
│   │       │   ├── optimize.ts      # Offer optimization endpoint
│   │       │   ├── dashboard.ts     # Dashboard stats
│   │       │   └── public/          # Public apply, vehicles
│   │       ├── engine/              # Core decision engine
│   │       │   ├── evaluation/      # policyEngine.ts, eligibility.ts
│   │       │   ├── rules/           # ruleEvaluator.ts, operators.ts
│   │       │   ├── scoring/         # riskScore.ts, affordability.ts
│   │       │   ├── pricing/         # loanCalculator.ts
│   │       │   └── offers/          # offerGenerator.ts, compareOffers.ts, Ranking.ts
│   │       ├── middleware/          # Auth, validation, rate limiting, security headers
│   │       ├── lib/                 # DB pool, helpers
│   │       ├── plugins/            # Fastify plugins
│   │       └── cli/                # CLI tools (runner.ts)
│   │
│   ├── admin-dashboard/            # React SPA
│   │   └── src/
│   │       ├── components/         # Reusable UI components
│   │       ├── features/           # Feature modules
│   │       ├── i18n/              # Localization (ar, en)
│   │       ├── layouts/           # Layout components
│   │       ├── lib/               # API client, utilities
│   │       ├── pages/             # Page components
│   │       └── routes/            # Route definitions
│   │
│   └── widget/                     # Embeddable iframe widget
│       └── src/
│           ├── App.tsx
│           └── main.tsx
│
├── packages/
│   ├── config/                     # Runtime configuration
│   │   └── index.ts
│   ├── db/                         # Prisma schema + seed
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       └── seed.ts
│   ├── types/                      # Shared TypeScript types
│   │   └── src/
│   │       ├── app.ts             # Application input/output types
│   │       ├── auth.ts            # Auth types
│   │       ├── bank.ts            # Bank types
│   │       ├── customer.ts        # Customer types
│   │       ├── evaluate.ts        # Evaluation types
│   │       ├── offer.ts           # Offer types
│   │       ├── program.ts         # Program types
│   │       ├── rule.ts            # Rule types
│   │       └── vehicle.ts         # Vehicle types
│   ├── shared-types/              # Re-exports from @lens/types
│   └── utils/                     # Utilities
│       └── src/
│           ├── cn.ts              # Class name utility
│           ├── clamp.ts           # Clamp utility
│           └── format.ts          # Number/date formatting
│
├── Dockerfile                      # Multi-stage production build
├── railway.json                    # Railway deployment config
├── turbo.json                      # Turborepo config
└── package.json                    # Monorepo root
```

---

## 4 | Database Schema

### Entity Relationship

```
Tenant (1) ──< Bank (N)
Tenant (1) ──< Program (N) >── Bank (1)
Program (1) ──< Rule (N)
Tenant (1) ──< Customer (N)
Tenant (1) ──< Vehicle (N)
Customer (1) ──< Application (N) >── Vehicle (1)
Application (1) ──< Offer (N) >── Program (1) >── Bank (1)
Tenant (1) ──< User (N)
Tenant (1) ──< AuditLog (N)
Tenant (1) ──< RefreshToken (N)
User (1) ──< User (N) [manager hierarchy]
User (1) ──< RefreshToken (N)
```

### Models

| Model | Table | Key Fields |
|-------|-------|------------|
| **Tenant** | `tenants` | `id`, `name`, `email`, `password_hash`, `api_key_hash`, `role`, `max_users` |
| **User** | `users` | `id`, `tenant_id`, `manager_id`, `name`, `email`, `password_hash`, `role` |
| **Bank** | `banks` | `id`, `tenant_id`, `name`, `code`, `active` |
| **Program** | `programs` | `id`, `tenant_id`, `bank_id`, `financing_type`, `calculation_method`, `interest_rate`, `min_salary`, `max_customer_age`, `max_car_age`, `min_down_payment_percent`, `max_months` |
| **Rule** | `rules` | `id`, `tenant_id`, `program_id`, `field`, `operator`, `value`, `action` |
| **Customer** | `customers` | `id`, `tenant_id`, `name`, `national_id`, `phone`, `salary`, `job_type`, `current_liabilities` |
| **Vehicle** | `vehicles` | `id`, `tenant_id`, `brand`, `model`, `manufacturing_year`, `condition`, `price`, `category` |
| **Application** | `applications` | `id`, `tenant_id`, `customer_id`, `vehicle_id`, `requested_down_payment`, `requested_months`, `status` |
| **Offer** | `offers` | `id`, `tenant_id`, `application_id`, `program_id`, `bank_id`, `installment`, `dti`, `risk_score`, `risk_level` |
| **AuditLog** | `audit_logs` | `id`, `tenant_id`, `user_id`, `action`, `entity`, `entity_id`, `details` |
| **RefreshToken** | `refresh_tokens` | `id`, `tenant_id`, `user_id`, `token_hash`, `expires_at` |

### Enums

| Enum | Values |
|------|--------|
| `ApplicationStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `UNDER_REVIEW` |
| `JobType` | `private`, `government`, `corporate`, `freelancer`, `retired` |
| `VehicleCondition` | `new`, `used` |
| `VehicleCategory` | `sedan`, `suv`, `truck`, `van`, `microbus` |
| `FinancingType` | `conventional`, `islamic` |
| `CalculationMethod` | `reducing`, `flat`, `murabaha` |
| `AllowedConditions` | `new`, `used`, `both` |
| `PaymentMethod` | `salary_transfer`, `bank_account`, `cash_proof` |
| `Role` | `ADMIN`, `MANAGER`, `SALES_AGENT` |

---

## 5 | API Reference

### Base URL

```
Production: https://[your-domain].app/api/v1
Development: http://localhost:3000/api/v1
```

### Authentication

| Endpoint | Method | Rate Limit | Description |
|----------|--------|------------|-------------|
| `/auth/register` | POST | 3/hour | Register new tenant |
| `/auth/login` | POST | 5/15min | Login, returns JWT + refresh token |
| `/auth/refresh` | POST | — | Refresh access token |
| `/auth/logout` | POST | — | Invalidate refresh token |
| `/me` | GET | — | Get current user info |
| `/auth/profile` | GET | — | Get tenant profile |
| `/auth/profile` | PATCH | — | Update profile |
| `/auth/password` | PATCH | — | Change password |
| `/auth/regenerate-key` | POST | — | Regenerate API key |

### Admin — Banks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/banks` | GET | List all banks for tenant |
| `/admin/banks` | POST | Create bank |
| `/admin/banks/:id` | PATCH | Update bank |
| `/admin/banks/:id` | DELETE | Delete bank |

### Admin — Programs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/programs` | GET | List programs (supports `bankId` query param) |
| `/admin/programs` | POST | Create program |
| `/admin/programs/:id` | PATCH | Update program |
| `/admin/programs/:id` | DELETE | Delete program |

### Admin — Rules

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/rules/:programId` | GET | Get rules for a program |
| `/admin/rules` | POST | Create rule |
| `/admin/rules/:id` | PUT | Update rule |
| `/admin/rules/:id` | DELETE | Delete rule |

### Admin — Customers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/customers` | GET | List customers (supports `search` query param) |
| `/admin/customers` | POST | Create customer |
| `/admin/customers/:id` | PATCH | Update customer |
| `/admin/customers/:id` | DELETE | Delete customer |

### Admin — Vehicles

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/vehicles` | GET | List vehicles |
| `/admin/vehicles` | POST | Create vehicle |
| `/admin/vehicles/:id` | PATCH | Update vehicle |
| `/admin/vehicles/:id` | DELETE | Delete vehicle |

### Admin — Applications

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/applications` | GET | List applications (supports `status` query param) |
| `/admin/applications` | POST | Create application |
| `/admin/applications/:id/status` | PATCH | Update application status |

### Admin — Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/users` | GET | List users |
| `/admin/users` | POST | Create user |
| `/admin/users/:id` | PATCH | Update user |
| `/admin/users/:id` | DELETE | Delete user |

### Admin — Audit

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/audit` | GET | Get audit logs |

### Core Business

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/evaluate` | POST | JWT | Run credit evaluation on an application |
| `/optimize` | POST | JWT | Get optimization suggestions for an application |
| `/dashboard/stats` | GET | JWT | Dashboard statistics |

### Public

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/public/vehicles/:code` | GET | API Key | — | Get vehicles for a dealer |
| `/public/apply` | POST | API Key | 10/min | Submit public application |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (no auth) |

### Standard Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 100 }  // optional, for paginated responses
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Description of the error",
    "details": [...]  // optional field-level errors
  }
}
```

---

## 6 | Engine — Decision Pipeline

### Pipeline Execution Flow

```
evaluateApplication(input: ApplicationInput)
│
├── 1. runPolicyEngine(program, input)
│   │   For each rule in program:
│   │     evaluateRule(rule, input) → Decision (APPROVE | REJECT | CONDITIONAL) | null
│   │   If REJECT → short-circuit, return rejected offer
│   │
├── 2. checkEligibility(input)
│   │   calculateDTI(liabilities, installment, salary)
│   │   DTI = (liabilities + installment) / salary * 100
│   │   Government employees: DTI cap = 55%
│   │   Others: DTI cap = 50%
│   │   Hard ceiling: 60%
│   │
├── 3. evaluateRisk(input)
│   │   Factors: DTI, salary bracket, age, job type, iScore
│   │   Base risk score = 20
│   │   DTI adjustment: DTI * 0.3
│   │   Salary bracket adjustment
│   │   Age adjustment: -5 (25-40), +5 (<25 or >50)
│   │   Employment adjustment: -10 (gov), -5 (corporate), +10 (freelancer)
│   │   iScore adjustment: Excellent(700+) → -15, Good(600-699) → -5
│   │                       Fair(500-599) → +10, Poor(400-499) → +20
│   │                       Bad(<400) → +35, and forces HIGH risk
│   │   Classification: HIGH (>=65), MEDIUM (>=35), LOW
│   │
├── 4. calculatePricing(input, program)
│   │   Reducing balance: compound interest, Newton-Raphson IRR for APR
│   │   Flat rate: simple interest
│   │   Murabaha: cost + profit, fixed installment
│   │
├── 5. generateOffer(input, program, evaluation)
│   │   Compute: loan amount, installment, DTI, risk, affordability
│   │   Approval probability formula:
│   │     REJECTED: 50 - (DTI * 0.3 + riskScore * 0.4), min 5%
│   │     APPROVED: affordability * 0.5 + (100-riskScore) * 0.3 + (100-DTI) * 0.2, max 99%
│   │
└── 6. compareOffers(programs, input)
        Generates offers across all programs with multiple tenor/down-payment combos
        New cars: tenors [12, 24, 36, 48, 60], DP [20, 25, 30, 35, 40, 50]%
        Used cars: tenors [12, 24, 36], DP [25, 30, 35, 40, 50]%
        Max LTV: 80% new, 70% used
        Car age: max 7 years finance (new), max 5 years (used)
        Ranking: weighted score (cost 30%, fitness 30%, probability 20%, DP 10%, match 10%)
```

### Types

```typescript
interface ApplicationInput {
  id?: number
  age: number
  salary: number
  price: number
  current_liabilities: number
  owns_property: boolean
  owns_car: boolean
  club_membership?: string
  insurance_number?: string
  requestedDownPayment: number
  job_type: string
  car_age: number
  salary_transfer: boolean
  iScore?: number
  carYear: number
  vehicleCondition: "new" | "used"
}

interface Offer {
  programId: number
  bankId: number
  programName: string
  bankName: string
  status: ApplicationStatus
  installment: number
  totalPayment: number
  financeAmount: number
  downPayment: number
  interestRate: number
  months: number
  dti: number
  riskScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  affordabilityScore: number
  approvalProbability: number
  reasons: string[]
  effectiveAnnualRate: number
  tenor: number
  downPaymentPct: number
  loanAmount: number
  LTV: number
  calculationMethod: "reducing" | "flat" | "murabaha"
}
```

### Rule Engine — Operators

| Operator | Description |
|----------|-------------|
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal |
| `>=` | Greater than or equal |
| `=` | Equal (string or numeric) |
| `!=` | Not equal |

### Rule Fields

| Field | Type | Description |
|-------|------|-------------|
| `age` | number | Customer age |
| `salary` | number | Monthly salary |
| `price` | number | Vehicle price |
| `car_age` | number | Vehicle age in years |
| `job_type` | string | Employment type |
| `owns_property` | boolean | Property ownership |
| `salary_transfer` | boolean | Salary transfer to bank |
| `down_payment` | number | Down payment amount |

### Rule Actions

| Action | Effect |
|--------|--------|
| `REJECT` | Application is rejected immediately |
| `REQUIRED` | Application requires manual review |
| `WARN` | Warning issued, application continues |

---

## 7 | Authentication & Authorization

### Token-based Auth Flow

```
1. POST /auth/login → { email, password }
2. Server validates credentials → returns { accessToken, refreshToken }
3. Client stores accessToken (15min expiry)
4. All subsequent API calls include: Authorization: Bearer <accessToken>
5. When accessToken expires → POST /auth/refresh → new token pair
6. Refresh tokens are rotated (old deleted on refresh)
```

### API Key Auth (for Widget/Public)

```
Header: x-api-key: <api_key>
API keys are hashed (SHA-256) before storage
```

### Rate Limiting

| Route | Limit |
|-------|-------|
| `/auth/login` | 5 requests per 15 minutes |
| `/auth/register` | 3 requests per hour |
| `/public/*` | 10 requests per minute |
| General API | 100 requests per minute |

---

## 8 | Security

### Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: [configured per environment]
```

### Encryption

- **PII Encryption**: AES-256-GCM via `ENCRYPTION_KEY` env var (optional)
- **Password Hashing**: bcrypt, 10 rounds
- **API Key Hashing**: SHA-256
- **JWT Signing**: HS256 with `JWT_SECRET` (64-char hex minimum)
- **Transport**: TLS 1.3 enforced in production

### Database

- Parameterized queries prevent SQL injection
- Multi-tenant row-level isolation via `tenant_id` filters
- Connection pooling via `pg.Pool`

---

## 9 | Widget Integration

### Iframe Embed

```html
<iframe
  src="https://widget.lensiq.app?customerId={customerId}&apiKey={dealerApiKey}"
  width="100%"
  height="600"
  frameborder="0"
  allow="cross-origin-isolated"
></iframe>
```

### API Key Usage

The widget authenticates via `x-api-key` header. API keys are generated per tenant and can be regenerated via the admin dashboard.

### Public Apply Page

```
URL: https://[domain]/apply/:tenantCode
```

A 4-step customer-facing wizard:
1. Select Vehicle
2. Personal Information
3. Financial Information
4. Application Details

The tenant code is derived from the API key hash. No authentication required from the customer.

---

## 10 | Deployment

### Docker (Multi-stage)

```bash
# Build
docker build -t lens-iq .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e REFRESH_TOKEN_SECRET="..." \
  lens-iq
```

### Railway

The project includes `railway.json` for zero-config deployment on Railway. Set the required environment variables in the Railway dashboard.

### Environment Variables Required

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | 64-char hex minimum |
| `REFRESH_TOKEN_SECRET` | Yes | — | Must differ from JWT_SECRET |
| `COOKIE_SECRET` | No | — | Session cookie signing |
| `ENCRYPTION_KEY` | No | — | 64-char hex for PII encryption |
| `PORT` | No | `3000` | API server port |
| `HOST` | No | `0.0.0.0` | Bind address |
| `NODE_ENV` | No | `production` | Environment |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `CORS_ORIGINS` | No | — | Comma-separated origins |
| `VITE_API_URL` | No | `http://localhost:3000` | Frontend API URL |
| `PGSSLMODE` | No | — | PostgreSQL SSL mode |

---

## 11 | Configuration

### Quick Start

```bash
# Install
npm install

# Generate Prisma client
npm run db:generate

# Push schema
npm run db:push

# Seed data
npm run db:seed

# Development
npm run dev          # API + Admin Dashboard (concurrent)
npm run dev:api      # API only
npm run dev:fe       # Admin Dashboard only

# Production build
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Engine Test

```bash
npm run engine:test
```

Runs market scenarios via `apps/api/src/cli/runner.ts`. Tests 5 scenarios:
- A: Standard Approval (government employee, good iScore)
- B: DTI Breach (high obligations)
- C: Car Age Constraint (old car)
- D: i-Score Block (bad credit)
- E: Flat vs Reducing APR comparison

---

## Engine Source Code Map

```
apps/api/src/engine/
├── evaluation/
│   ├── policyEngine.ts      # Rule evaluation pipeline
│   ├── eligibility.ts       # DTI eligibility check
│   └── index.ts
├── rules/
│   ├── ruleEvaluator.ts     # Individual rule evaluation
│   ├── operators.ts         # Operator implementations
│   └── index.ts
├── scoring/
│   ├── riskScore.ts         # Risk scoring algorithm
│   ├── affordability.ts     # Affordability scoring
│   └── index.ts
├── pricing/
│   ├── loanCalculator.ts    # Reducing, flat, Murabaha calculations
│   └── index.ts
├── offers/
│   ├── offerGenerator.ts    # Generate single offer
│   ├── compareOffers.ts     # Generate offers across programs
│   ├── Ranking.ts           # Offer ranking algorithm
│   └── index.ts
├── types.ts                 # Internal engine types
└── index.ts                 # evaluateApplication() entry point
```

---

> **End of Technical Documentation — For developer reference only**
