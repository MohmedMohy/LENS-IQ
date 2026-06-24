# Lens IQ

**AI-powered financing decision engine for car dealerships.**

Lens IQ helps dealerships increase financing approval rates, reduce qualification time, and optimize financing offers — without replacing their existing CRM.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Dealership CRM                     │
│  (iframes Widget or calls API via API key / JWT)     │
└──────────────┬──────────────────────┬────────────────┘
               │ Widget (iframe)      │ REST API
               ▼                      ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│     apps/widget         │  │     apps/api             │
│  React + Vite iframe    │  │  Fastify 5 + TypeScript  │
│  Embedded in CRM        │  │  /api/v1/* endpoints     │
└─────────────────────────┘  └──────────┬──────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │       packages/engine       │
                          │  Scoring, Rules, Pricing   │
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │    PostgreSQL + Prisma      │
                          └───────────────────────────┘
```

### Monorepo Structure

```
lens-iq/
├── apps/
│   ├── api/                 # Fastify 5 REST API
│   ├── admin-dashboard/     # React admin panel (Vite)
│   └── widget/              # Embeddable iframe widget
├── packages/
│   ├── db/                  # Prisma schema + client + seed
│   ├── engine/              # Scoring, rules, pricing
│   ├── types/               # Shared TypeScript interfaces
│   ├── utils/               # Utilities (cn, clamp, format)
│   └── config/              # Runtime configuration
├── docs/
│   ├── audit-report.md          # Initial codebase audit
│   ├── api-reference.md         # Full API documentation
│   ├── widget-integration.md    # Widget embed guide
│   ├── deployment.md            # Deployment instructions
│   ├── roadmap.md               # Execution plan
│   ├── AR-FULL-DOCUMENTATION.md # Arabic full documentation
│   ├── AR-ANALYSIS-REPORT.md    # Arabic architecture analysis + blockers + plan
│   └── AR-BLOCKERS-CHECKLIST.md # Arabic blockers checklist with tracking
├── Dockerfile               # Production Docker build
├── railway.json             # Railway deployment config
└── turbo.json               # Turborepo configuration
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed data (admin tenant + sample banks/programs)
npm run db:seed

# Start development (API + admin dashboard)
npm run dev
```

The API runs on `http://localhost:3000` and the admin dashboard on `http://localhost:5173`.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | 64-char hex string for JWT signing |
| `PORT` | No | `3000` | API server port |
| `HOST` | No | `0.0.0.0` | API server host |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed origins |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `VITE_API_URL` | No | `http://localhost:3000` | Frontend API base URL |

---

## Development

```bash
# API only
npm run dev:api

# Admin dashboard only
npm run dev:fe

# Both (concurrently)
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build all
npm run build
```

---

## Key Features

- **Multi-tenant**: Each dealership is a tenant with isolated data
- **Financing Engine**: Rule-based eligibility + risk scoring + pricing
- **Approval Probability**: Every offer includes a 0-99% approval score
- **Offer Optimizer**: Suggests parameter changes to improve approval rates
- **Program Management**: Configure financing programs with custom rules
- **Public Apply**: Embeddable customer-facing application form
- **Widget**: Iframe-based integration for existing CRMs

---

## API Overview

All API routes (except public endpoints) require authentication via JWT Bearer token or `x-api-key` header.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/register` | POST | No | Register tenant |
| `/api/v1/auth/login` | POST | No | Login |
| `/api/v1/evaluate` | POST | Yes | Evaluate application |
| `/api/v1/optimize` | POST | Yes | Get optimization suggestions |
| `/api/v1/admin/banks` | GET/POST | Yes | Manage banks |
| `/api/v1/admin/programs` | GET/POST | Yes | Manage programs |
| `/api/v1/admin/rules/:programId` | GET | Yes | Get rules |
| `/public/apply` | POST | API Key | Public application |
| `/health` | GET | No | Health check |

---

## Deployment

See [docs/deployment.md](docs/deployment.md) for detailed instructions.

The platform is designed for [Railway](https://railway.app) deployment with zero configuration — just set the environment variables and deploy.
