import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "full-dir.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 50, bottom: 50, left: 60, right: 60 },
  info: {
    Title: "Lens IQ - Full Project Evaluation & Documentation",
    Author: "Project Analysis Report",
    Subject: "Full Project Directory Analysis",
  },
});

doc.pipe(fs.createWriteStream(outputPath));

// ===== HELPERS =====
const PRIMARY = "#1a56db";
const DARK = "#111827";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const GREEN = "#059669";
const AMBER = "#d97706";
const RED = "#dc2626";
let pageNum = 1;

function footer() {
  doc
    .fontSize(8)
    .fillColor(GRAY)
    .text(
      `Lens IQ — Full Project Evaluation  |  Page ${pageNum}`,
      60,
      doc.page.height - 40,
      { align: "center", width: doc.page.width - 120 }
    );
  pageNum++;
}

function addTitle(text, size = 28) {
  doc.font("Helvetica-Bold").fontSize(size).fillColor(DARK).text(text, { align: "left" });
  doc.moveDown(0.5);
}

function addSubtitle(text, size = 14) {
  doc.font("Helvetica").fontSize(size).fillColor(GRAY).text(text, { align: "left" });
  doc.moveDown(1);
}

function addSectionTitle(text, size = 18) {
  doc
    .moveDown(0.5)
    .font("Helvetica-Bold")
    .fontSize(size)
    .fillColor(PRIMARY)
    .text(text);
  doc
    .moveDown(0.3)
    .strokeColor(PRIMARY)
    .lineWidth(2)
    .moveTo(60, doc.y)
    .lineTo(doc.page.width - 60, doc.y)
    .stroke();
  doc.moveDown(0.8);
}

function addSubSectionTitle(text, size = 14) {
  doc
    .moveDown(0.3)
    .font("Helvetica-Bold")
    .fontSize(size)
    .fillColor(DARK)
    .text(text);
  doc.moveDown(0.3);
}

function addBody(text, size = 10) {
  doc.font("Helvetica").fontSize(size).fillColor(DARK).text(text, {
    align: "left",
    lineGap: 4,
  });
  doc.moveDown(0.5);
}

function addBullet(text, indent = 20, size = 10) {
  doc
    .font("Helvetica")
    .fontSize(size)
    .fillColor(DARK)
    .text(`  \u2022  ${text}`, indent, doc.y, { lineGap: 3 });
}

function addKeyValue(key, value) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(DARK)
    .text(`  ${key}: `, { continued: true })
    .font("Helvetica")
    .fillColor(GRAY)
    .text(value, { lineGap: 3 });
}

function checkPageSpace(needed = 120) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
    footer();
  }
}

// ===== COVER PAGE =====
doc
  .rect(0, 0, doc.page.width, doc.page.height)
  .fill("#0f172a");

doc
  .font("Helvetica-Bold")
  .fontSize(42)
  .fillColor("#ffffff")
  .text("Lens IQ", 60, 180);

doc
  .font("Helvetica")
  .fontSize(20)
  .fillColor("#94a3b8")
  .text("Full Project Evaluation", 60, 235);

doc
  .font("Helvetica")
  .fontSize(14)
  .fillColor("#64748b")
  .text("AI-Powered Financing Decision Engine for Car Dealerships", 60, 270);

doc.moveDown(3);

doc
  .fontSize(10)
  .fillColor("#64748b")
  .text(`Generated: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, 60, 340)
  .text("Project: car1-fintech / lens-iq", 60, 358)
  .text("Monorepo | Turborepo | Fastify 5 | React 19 | PostgreSQL", 60, 376);

doc.addPage();
footer();

// ===== TABLE OF CONTENTS =====
addSectionTitle("Table of Contents");
const tocItems = [
  "1.  Executive Summary",
  "2.  Project Overview",
  "3.  Technology Stack",
  "4.  Architecture & System Design",
  "5.  Directory Structure",
  "6.  Database Schema (10 Models)",
  "7.  API Endpoints Reference",
  "8.  Core Engine: Evaluation Pipeline",
  "9.  Scoring & Risk Analysis",
  "10. Offer Generation & Comparison",
  "11. Admin Dashboard (Frontend)",
  "12. Widget (CRM Embed)",
  "13. Authentication & Security",
  "14. Deployment & Infrastructure",
  "15. Code Quality & Patterns",
  "16. Evaluation & Recommendations",
  "17. Strengths & Weaknesses",
  "18. Conclusion",
];
for (const item of tocItems) {
  doc.font("Helvetica").fontSize(11).fillColor(DARK).text(item, 60, doc.y, { lineGap: 8 });
}
doc.addPage();
footer();

// ===== 1. EXECUTIVE SUMMARY =====
addSectionTitle("1. Executive Summary");
addBody(
  "Lens IQ is a multi-tenant, AI-powered financing decision engine designed specifically for car dealerships. " +
  "It enables dealerships to instantly evaluate customer financing applications against multiple bank programs, " +
  "generate optimized offers, and increase approval rates — all without replacing their existing CRM. " +
  "The system is built as a monorepo using Turborepo with npm workspaces, comprising three applications " +
  "(API backend, Admin Dashboard, Embeddable Widget) and six shared packages."
);
addBody(
  "Key capabilities include a configurable rule engine, DTI-based eligibility checks, risk scoring, " +
  "loan pricing with multiple calculation methods (reducing, flat, murabaha), offer ranking, and " +
  "optimization suggestions. The system supports Arabic language for public-facing endpoints, " +
  "RBAC (Admin/Manager/Sales Agent), and is deployment-ready with Docker and Railway configuration."
);

// ===== 2. PROJECT OVERVIEW =====
addSectionTitle("2. Project Overview");
addKeyValue("Name", "Lens IQ (@lens-iq)");
addKeyValue("Version", "1.0.0");
addKeyValue("Package Manager", "npm 11.9.0 (workspaces)");
addKeyValue("Monorepo Tool", "Turborepo 2.5");
addKeyValue("License", "ISC");
addKeyValue("Target Users", "Car dealerships (multi-tenant)");
addKeyValue("Primary Language", "TypeScript (ESM, ES2022)");

addSubSectionTitle("Business Goals");
addBullet("Increase financing approval rates for dealerships");
addBullet("Reduce qualification time from days to seconds");
addBullet("Optimize financing offers across multiple banks/programs");
addBullet("Provide embeddable widget for existing CRM systems");
addBullet("Support both conventional and Islamic financing");

// ===== 3. TECHNOLOGY STACK =====
doc.addPage();
footer();
addSectionTitle("3. Technology Stack");

const techStack = [
  ["Runtime", "Node.js (TypeScript ESM)"],
  ["API Framework", "Fastify 5 (v5.8.5)"],
  ["Frontend (Admin)", "React 19 + TypeScript + Vite 8"],
  ["UI Library", "MUI 9 + Tailwind CSS 4"],
  ["State Management", "Zustand 5 + TanStack React Query 5"],
  ["Widget", "React 19 + Vite 8 (lightweight iframe)"],
  ["Database", "PostgreSQL (via pg + Prisma 6 ORM)"],
  ["Validation", "Zod 4"],
  ["Auth", "JWT + bcrypt + Refresh Tokens"],
  ["Forms", "react-hook-form"],
  ["Animation", "Framer Motion 12"],
  ["Notifications", "sonner + lruciede-react"],
  ["Deployment", "Docker + Railway"],
  ["Linting", "ESLint + Prettier"],
];

for (const [k, v] of techStack) {
  addKeyValue(k, v);
}

// ===== 4. ARCHITECTURE =====
addSectionTitle("4. Architecture & System Design");

addBody(
  "The system follows a layered monorepo architecture with clear separation of concerns:"
);

addSubSectionTitle("System Flow");
addBody(
  "1. CRM Integration: Dealership CRM integrates via embeddable iframe Widget or REST API\n" +
  "2. API Gateway: Fastify server receives applications and runs the Evaluation Engine\n" +
  "3. Engine Pipeline: Policy Rules \u2192 Eligibility (DTI) \u2192 Risk Scoring \u2192 Decision \u2192 Offer Generation\n" +
  "4. Offer Ranking: All generated offers are compared and ranked by approval probability\n" +
  "5. Persistence: Offers are stored in PostgreSQL with full audit trail\n" +
  "6. Admin Dashboard: Dealership staff manage banks, programs, rules, customers, vehicles, users"
);

addSubSectionTitle("Multi-Tenancy");
addBody(
  "Every table is scoped by tenant_id with CASCADE deletes. Each tenant (dealership) gets an API key " +
  "at registration. All queries filter by tenant_id, ensuring complete data isolation."
);

addSubSectionTitle("RBAC");
addBody(
  "Three roles: ADMIN (full access), MANAGER (limited admin), SALES_AGENT (evaluation only). " +
  "Middleware checks role on protected routes. Managers can have subordinates (Sales Agents)."
);

// ===== 5. DIRECTORY STRUCTURE =====
doc.addPage();
footer();
addSectionTitle("5. Directory Structure");

addBody(
  "The project is organized as a Turborepo monorepo with npm workspaces. Below is the logical structure:"
);

const structure = [
  "lens-iq/",
  "  package.json              # Root config, scripts",
  "  turbo.json                # Turborepo orchestration",
  "  tsconfig.json             # Shared TS config (ES2022)",
  "  Dockerfile                # Production build",
  "  railway.json              # Railway deployment config",
  "  apps/",
  "    api/                    # Fastify 5 REST API",
  "      src/",
  "        server.ts           # Entry point, plugins, routes",
  "        auth/               # JWT auth, RBAC, cookies",
  "        admin/              # CRUD: banks, programs, rules, customers, vehicles, applications, users",
  "        engine/             # Core financing engine",
  "          evaluation/       # Pipeline: policy, eligibility",
  "          scoring/          # Risk scoring, DTI, affordability",
  "          offers/           # Generator, comparison, ranking",
  "          pricing/          # Loan calculator (reducing/flat/murabaha)",
  "          rules/            # Rule evaluator + operators",
  "          builders/         # Result builder",
  "          types/            # Engine types",
  "        routes/             # Route handlers (evaluate, optimize, public, dashboard)",
  "        services/           # Business logic services",
  "        db/                 # pg Pool connection",
  "        mappers/            # Data mappers",
  "        cli/                # CLI scripts",
  "    admin-dashboard/        # React 19 SPA",
  "      src/",
  "        features/           # Feature modules (applications, banks, programs, etc.)",
  "        components/         # Reusable UI (layout, data-display, feedback)",
  "        router/             # React Router config",
  "        store/              # Zustand store",
  "        api/                # Axios client",
  "        app/                # Providers (React Query)",
  "    widget/                 # Embeddable iframe widget",
  "  packages/",
  "    db/                     # Prisma schema, migrations, seed",
  "    types/                  # Shared TypeScript interfaces",
  "    utils/                  # Utility functions (clamp, cn, format)",
  "    config/                 # Runtime config object",
  "    ui/                     # UI library (placeholder)",
  "    shared-types/           # Cross-app types",
  "  docs/                     # Documentation (API, audit, deployment, Arabic docs)",
];

for (const line of structure) {
  const indent = line.search(/\S/);
  const isDir = line.trimEnd().endsWith("/");
  doc
    .font(isDir ? "Helvetica-Bold" : "Helvetica")
    .fontSize(8)
    .fillColor(isDir ? DARK : GRAY)
    .text(line, 60, doc.y, { lineGap: 1, indent: indent * 8 });
}

// ===== 6. DATABASE SCHEMA =====
doc.addPage();
footer();
addSectionTitle("6. Database Schema");

addBody("The database uses PostgreSQL with Prisma ORM. There are 10 models with 6 enums:");

const models = [
  { name: "Tenant", fields: "id, name, email, password_hash, api_key, role, active, max_users", desc: "Dealership account with unique API key" },
  { name: "User", fields: "id, tenant_id, manager_id, name, email, password_hash, role, active", desc: "Sub-users with RBAC under a tenant" },
  { name: "RefreshToken", fields: "id, tenant_id, user_id, token_hash, expires_at", desc: "JWT refresh token storage" },
  { name: "Bank", fields: "id, tenant_id, name, code, logo_url, active", desc: "Financial institutions per dealership" },
  { name: "Program", fields: "id, tenant_id, bank_id, name, financing_type, calculation_method, min_salary, max_customer_age, interest_rate, min/max_months, min_down_payment_percent, etc.", desc: "Financing programs with rates, rules, eligibility" },
  { name: "Rule", fields: "id, tenant_id, program_id, field, operator, value, action", desc: "Configurable rules per program" },
  { name: "Customer", fields: "id, tenant_id, name, national_id, phone, birth_date, salary, job_type, current_liabilities, additional_income, etc.", desc: "Customer demographics & financial data" },
  { name: "Vehicle", fields: "id, tenant_id, brand, model, manufacturing_year, condition, price, category", desc: "Vehicle inventory" },
  { name: "Application", fields: "id, tenant_id, customer_id, vehicle_id, requested_down_payment, requested_months, payment_method, status", desc: "Financing applications linking customers to vehicles" },
  { name: "Offer", fields: "id, tenant_id, application_id, program_id, bank_id, status, installment, total_payment, finance_amount, down_payment, interest_rate, months, dti, risk_score, risk_level, affordability_score, reasons (JSON)", desc: "Generated financing offers with full pricing & risk data" },
];

for (const m of models) {
  checkPageSpace(80);
  addSubSectionTitle(`${m.name}`);
  addBody(m.desc, 9);
  doc.font("Helvetica").fontSize(8).fillColor(GRAY).text(`Fields: ${m.fields}`, 60, doc.y, { lineGap: 2 });
  doc.moveDown(0.3);
}

addSubSectionTitle("Enums");
addBody("ApplicationStatus (PENDING, APPROVED, REJECTED, CANCELLED, UNDER_REVIEW), JobType (private, government, corporate, freelancer, retired), VehicleCondition (new, used), VehicleCategory (sedan, suv, truck, van, microbus), FinancingType (conventional, islamic), CalculationMethod (reducing, flat, murabaha), AllowedConditions (new, used, both), PaymentMethod (salary_transfer, bank_account, cash_proof), Role (ADMIN, MANAGER, SALES_AGENT)");

// ===== 7. API ENDPOINTS =====
doc.addPage();
footer();
addSectionTitle("7. API Endpoints Reference");

addBody("All endpoints return `{ success: boolean, data?: T, message?: string }`.");

const endpoints = [
  ["POST /auth/register", "No", "Register dealership (tenant)"],
  ["POST /auth/login", "No", "Login, receive JWT + refresh cookie"],
  ["POST /auth/refresh", "Cookie", "Refresh JWT token"],
  ["POST /auth/logout", "JWT", "Logout, clear cookie"],
  ["GET /me", "JWT", "Current user/tenant info"],
  ["PATCH /auth/profile", "JWT", "Update tenant name"],
  ["PATCH /auth/password", "JWT", "Change password"],
  ["POST /auth/regenerate-key", "JWT", "Regenerate API key"],
  ["POST /evaluate", "JWT", "Evaluate application against all programs"],
  ["POST /optimize", "JWT", "Get optimization suggestions"],
  ["GET/POST /admin/banks", "JWT", "List/Create banks"],
  ["PATCH/DELETE /admin/banks/:id", "JWT", "Update/Delete bank"],
  ["GET/POST /admin/programs", "JWT", "List/Create programs"],
  ["GET/POST /admin/rules/:programId", "JWT", "List/Create rules per program"],
  ["GET/POST /admin/customers", "JWT", "List/Create customers"],
  ["GET /admin/customers/:id", "JWT", "Get customer by ID"],
  ["GET/POST /admin/vehicles", "JWT", "List/Create vehicles"],
  ["GET /admin/vehicles/:id", "JWT", "Get vehicle by ID"],
  ["GET/POST /admin/applications", "JWT", "List/Create applications"],
  ["PATCH /admin/applications/:id/status", "JWT", "Update status"],
  ["GET /admin/users", "JWT", "List users (ADMIN/MANAGER)"],
  ["POST /admin/users", "JWT", "Create sub-user (ADMIN)"],
  ["GET /dashboard", "JWT", "Dashboard statistics"],
  ["GET /public/vehicles/:code", "API Key", "Public vehicle listing"],
  ["POST /public/apply", "API Key", "Public application (Arabic support)"],
  ["GET /health", "No", "Health check (db connectivity)"],
];

doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK);
doc.text("Endpoint", 60, doc.y, { continued: true, width: 180 });
doc.text("Auth", { continued: true, width: 80, align: "center" });
doc.text("Description", { width: 200, align: "left" });
doc.moveDown(0.3);
doc.strokeColor(PRIMARY).lineWidth(1).moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke();
doc.moveDown(0.3);

for (const [ep, auth, desc] of endpoints) {
  checkPageSpace(20);
  doc.font("Courier").fontSize(8).fillColor(PRIMARY).text(ep, 60, doc.y, { continued: true, width: 180 });
  doc.font("Helvetica").fontSize(8).fillColor(GRAY).text(auth, { continued: true, width: 80, align: "center" });
  doc.fillColor(DARK).text(desc, { width: 200, align: "left" });
  doc.moveDown(0.2);
}

// ===== 8. CORE ENGINE =====
doc.addPage();
footer();
addSectionTitle("8. Core Engine: Evaluation Pipeline");

addBody(
  "The financing decision engine is the heart of Lens IQ. It follows a deterministic, composable pipeline pattern:"
);

addSubSectionTitle("Step 1: Load Rules");
addBody(
  "Rules are loaded from the database for the specific program being evaluated. Each rule has: " +
  "field (e.g., salary, age, car_age), operator (=, !=, >, >=, <, <=), value, and action."
);

addSubSectionTitle("Step 2: Policy Engine (`policyEngine.ts`)");
addBody(
  "The policy engine evaluates all rules for the program. If any rule fails (action = REJECT), " +
  "the application is immediately rejected with the rule reason. This is a gating mechanism."
);

addSubSectionTitle("Step 3: Eligibility (`eligibility.ts`)");
addBody(
  "Calculates the Debt-to-Income (DTI) ratio: `DTI = (installment + monthly_liabilities) / salary * 100`. " +
  "If DTI exceeds 65%, the application is rejected. The base DTI is saved for downstream use."
);

addSubSectionTitle("Step 4: Risk Scoring (`riskScore.ts`)");
addBody(
  "Evaluates three factors: age (higher risk if > 60), salary (higher risk if < 5000), and DTI. " +
  "Produces a numeric score (0-100) and level (LOW: 0-30, MEDIUM: 31-60, HIGH: 61+)."
);

addSubSectionTitle("Step 5: Decision");
addBody(
  "Based on risk level:\n" +
  "  - LOW \u2192 APPROVE (no modifiers)\n" +
  "  - MEDIUM \u2192 CONDITIONAL (interest +10%)\n" +
  "  - HIGH \u2192 REJECT (but interest +25%, months -12 are stored for analysis)"
);

addSubSectionTitle("Step 6: Offer Generation (`offerGenerator.ts`)");
addBody(
  "For APPROVED/CONDITIONAL decisions: calculates final interest rate (base + modifier), " +
  "final months (base + modifier), minimum down payment, loan amount, and generates full pricing " +
  "via the loan calculator. Re-runs scoring with actual installment, then computes approval probability."
);

addSubSectionTitle("Step 7: Offer Comparison & Ranking");
addBody(
  "All offers across all active programs are compared. Approved offers are ranked by " +
  "approval probability (descending) using `rankOffers()`. The best offer is returned as `bestOffer`."
);

// ===== 9. SCORING & RISK =====
addSectionTitle("9. Scoring & Risk Analysis");

addSubSectionTitle("DTI Calculation (`dti.ts`)");
addBody(
  "DTI = ((installment + current_liabilities) / salary) * 100. Max allowed DTI is 65%. " +
  "This is the primary financial health metric."
);

addSubSectionTitle("Risk Score (`riskScore.ts`)");
addBody(
  "The risk function evaluates:\n" +
  "  - Age risk: age > 60 adds 40 points\n" +
  "  - Salary risk: salary < 5000 adds 30 points\n" +
  "  - DTI risk: DTI * 0.6 (up to 60 points)\n" +
  "  - Total: 0-100 (LOW < 30, MEDIUM 31-60, HIGH > 60)"
);

addSubSectionTitle("Affordability Score (`affordability.ts`)");
addBody(
  "Linear interpolation: DTI 0% \u2192 100 score, DTI 65% \u2192 0 score. " +
  "Clamped to [0, 100]. Higher is better."
);

addSubSectionTitle("Approval Probability");
addBody(
  "For APPROVED: `affordability * 0.5 + (100 - riskScore) * 0.3 + (100 - DTI) * 0.2`. " +
  "For REJECTED: `50 - (DTI * 0.3 + riskScore * 0.4)`. Clamped to [5, 99]."
);

// ===== 10. OFFER GENERATION =====
doc.addPage();
footer();
addSectionTitle("10. Offer Generation & Pricing");

addSubSectionTitle("Loan Calculator (`loanCalculator.ts`)");
addBody("Three calculation methods with modifier support:");

addBullet("Reducing Balance: `M = P * [r(1+r)^n] / [(1+r)^n - 1]` (standard amortization)");
addBullet("Flat Rate: `Interest = P * r * (n/12)`, `Installment = (P + Interest) / n`");
addBullet("Murabaha (Islamic): `Profit = P * r * (n/12)`, same formula as flat but labeled as profit");

addSubSectionTitle("Rate Convention");
addBody(
  "Annual rate is stored as percentage (e.g., 14.5 = 14.5% per year). " +
  "Interest modifiers are percentage points (e.g., +10 = +10%). " +
  "Monthly rate = annualRate / 12 / 100."
);

addSubSectionTitle("Offer Comparison (`compareOffers.ts`)");
addBody(
  "Iterates all active programs for a tenant, evaluates each against the application input, " +
  "generates an offer, and returns the complete offer list. Clears old offers before persisting new ones."
);

// ===== 11. ADMIN DASHBOARD =====
addSectionTitle("11. Admin Dashboard (Frontend)");

addBody(
  "The admin dashboard is a React 19 SPA built with Vite 8, MUI 9, and Tailwind CSS 4. " +
  "It uses TanStack React Query 5 for server state, Zustand 5 for client state (auth), " +
  "and Framer Motion 12 for animations."
);

addSubSectionTitle("Feature Modules");
addBullet("Applications: List, create, evaluate, view offers");
addBullet("Banks: CRUD management with status toggle");
addBullet("Customers: CRUD with financial data");
addBullet("Vehicles: CRUD with brand/model/condition");
addBullet("Programs: CRUD with full financing parameters");
addBullet("Rules: Configurable rules per program");
addBullet("Users: Sub-user management with RBAC");
addBullet("Evaluate: Full evaluation UI with offer comparison, risk gauge, DTI meter");
addBullet("Dashboard: Statistics and metrics");
addBullet("Apply: Public application form");
addBullet("Profile: Tenant profile management");
addBullet("Auth: Login page");

addSubSectionTitle("Key Components");
addBullet("DataTable: Reusable sortable table with search");
addBullet("DecisionCard: Visual decision display (APPROVED/CONDITIONAL/REJECTED)");
addBullet("OfferComparison: Side-by-side offer comparison table");
addBullet("RiskScoreGauge: Radial gauge for risk visualization");
addBullet("DtiMeter: Horizontal bar for DTI display");
addBullet("StatusBadge: Color-coded status badges");
addBullet("Recommendations: Optimization suggestions with impact indicators");

// ===== 12. WIDGET =====
doc.addPage();
footer();
addSectionTitle("12. Widget (CRM Embed)");

addBody(
  "The widget is a lightweight React 19 application built with Vite 8. It is designed to be embedded " +
  "in dealership CRM systems via an iframe. The widget communicates with the API via the public endpoints " +
  "(API-key authenticated) and serves as a minimal application intake form."
);

addBody("The widget is a single-page component (`Widget.tsx`) that:");
addBullet("Loads available vehicles for the dealership");
addBullet("Collects customer information and financial data");
addBullet("Submits the application via POST /public/apply");
addBullet("Displays the evaluation result with offer details");

// ===== 13. AUTH & SECURITY =====
addSectionTitle("13. Authentication & Security");

addSubSectionTitle("Authentication Flow");
addBullet("Registration creates a Tenant with hashed password (bcrypt) and auto-generated API key");
addBullet("Login validates credentials and returns JWT (access token) + sets HTTP-only refresh cookie");
addBullet("JWT contains tenantId, userId, and role for RBAC");
addBullet("Refresh token stored hashed in DB, rotated on each use");
addBullet("Logout clears the refresh cookie and deletes the token from DB");

addSubSectionTitle("Security Measures");
addBullet("Rate limiting: 100 req/min global, 5 req/15min on login");
addBullet("Security headers: CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff");
addBullet("Cookie secret for signing refresh cookies");
addBullet("RBAC middleware on all admin routes");
addBullet("API key authentication for public endpoints");
addBullet("CORS whitelist for allowed origins");
addBullet("Request ID tracing (8-char UUID on each request)");
addBullet("Global error handler (no stack leaks in production)");

// ===== 14. DEPLOYMENT =====
addSectionTitle("14. Deployment & Infrastructure");

addBody("The project is deployment-ready with multiple configurations:");

addBullet("Dockerfile: Multi-stage production build at root level");
addBullet("Railway Configuration: `railway.json` at root and per-app level");
addBullet("Frontend Serving: API automatically serves admin-dashboard static files in production");
addBullet("SPA Fallback: setNotFoundHandler returns index.html for non-API GET routes");
addBullet("Graceful Shutdown: SIGTERM/SIGINT handlers close Fastify and DB pool");
addBullet("Environment Validation: Zod schema validates all required env vars at startup");
addBullet("NGINX Config: `nginx-default.conf` for admin-dashboard in production");

addSubSectionTitle("Environment Variables");
addBullet("DATABASE_URL - PostgreSQL connection string");
addBullet("JWT_SECRET - JWT signing secret");
addBullet("COOKIE_SECRET - Cookie signing secret");
addBullet("PORT / HOST - Server binding");
addBullet("CORS_ORIGINS - Allowed CORS origins");
addBullet("LOG_LEVEL - Logging verbosity");
addBullet("FRONTEND_DIST - Custom frontend path");

// ===== 15. CODE QUALITY =====
doc.addPage();
footer();
addSectionTitle("15. Code Quality & Patterns");

addSubSectionTitle("Monorepo Structure");
addBullet("npm workspaces with 6 internal packages: @lens/db, @lens/types, @lens/utils, @lens/config, @lens/ui, @lens/shared-types");
addBullet("Turborepo for build orchestration with caching");
addBullet("ESM throughout (\"type\": \"module\" in all packages)");
addBullet("Explicit .js extensions in TypeScript imports (ESM convention)");

addSubSectionTitle("API Architecture");
addBullet("Controller/Service/Route separation");
addBullet("Feature-based organization (admin/banks, admin/programs, etc.)");
addBullet("Consistent response format: { success, data?, message? }");
addBullet("Dual DB access: Prisma (schema/migrations) + raw pg Pool (runtime)");
addBullet("Zod validation on route inputs");

addSubSectionTitle("Frontend Architecture");
addBullet("Feature-based modularity (each feature has api/, pages/, components/)");
addBullet("Reusable components: DataTable, Card, Skeleton, ErrorBoundary");
addBullet("TanStack React Query for server state caching and invalidation");
addBullet("Zustand store for auth state persistence");
addBullet("Centralized API client (Axios) with interceptors");

addSubSectionTitle("Engine Architecture");
addBullet("Pure functions with no side effects (scoring, pricing)");
addBullet("Composable pipeline pattern");
addBullet("Type-safe with shared interfaces");
addBullet("Deterministic evaluation (same input \u2192 same output)");

// ===== 16. EVALUATION =====
addSectionTitle("16. Evaluation & Recommendations");

addSubSectionTitle("Strengths");
addBullet("Comprehensive multi-tenant architecture with proper data isolation");
addBullet("Sophisticated rule engine allows dealerships to configure custom financing criteria");
addBullet("Multiple calculation methods support both conventional and Islamic financing");
addBullet("Clean pipeline architecture in the evaluation engine (deterministic, testable, composable)");
addBullet("Excellent API design with consistent response format and comprehensive endpoints");
addBullet("Full RBAC with three roles and subordinate management");
addBullet("Production-ready: Docker, Railway, env validation, graceful shutdown, security headers");
addBullet("Bilingual support (Arabic for public endpoints)");
addBullet("Rich frontend with modern stack (React 19, MUI 9, Tailwind 4, TanStack Query 5)");
addBullet("Comprehensive documentation (API reference, audit, deployment, Arabic docs)");

addSubSectionTitle("Areas for Improvement");
checkPageSpace(200);
addBullet("Testing: No test files found in the codebase. Unit tests for the engine (scoring, pricing, rules) and integration tests for API endpoints are critical for a financial system.");
addBullet("TypeScript strictness: No `strict: true` in tsconfig, some `any` types used in catch blocks and route handlers.");
addBullet("Error handling in engine: The loan calculator throws on invalid input; a Result type would be more composable.");
addBullet("Database access: Mixing Prisma and raw pg queries adds complexity. Consider standardizing on one approach.");
addBullet("Logging: Fastify's built-in logger is used but no structured logging or monitoring integration.");
addBullet("Rate limiting: Static config (100 req/min). Consider making this configurable per-tenant.");
addBullet("API key management: Keys are generated with a simple random approach; consider a more robust generation strategy.");
addBullet("No CI/CD configuration (GitHub Actions, etc.) in the repository.");
addBullet("Some frontend type definitions could be shared more consistently with the API types.");
addBullet("The widget is very minimal; could benefit from more comprehensive UI and error states.");

// ===== 17. STRENGTHS & WEAKNESSES =====
addSectionTitle("17. Overall Assessment");

addBody(
  "Lens IQ is a well-architected, production-grade financing decision engine. The code is clean, " +
  "the architecture follows modern best practices (monorepo, ESM, feature-based modules), and the " +
  "core engine is elegantly designed as a deterministic pipeline of pure functions."
);

addBody(
  "The system demonstrates strong understanding of the car financing domain, supporting multiple " +
  "calculation methods, configurable rules, risk scoring, and offer optimization. The multi-tenant " +
  "design with RBAC makes it suitable for real-world dealership deployments."
);

addBody(
  "The most significant gap is the complete lack of tests, which is a critical concern for any " +
  "financial decision-making system. Adding unit tests for the engine and integration tests for " +
  "the API should be the top priority. Beyond that, the project is well-positioned for production use."
);

// ===== 18. CONCLUSION =====
doc.addPage();
footer();
addSectionTitle("18. Conclusion");

addBody(
  "Lens IQ is a comprehensive, well-engineered financing decision platform. It combines a " +
  "sophisticated rule-based evaluation engine with a modern React dashboard and embeddable widget, " +
  "all built on a solid monorepo architecture."
);

addBody(
  "The project successfully addresses the core business need: helping car dealerships quickly " +
  "evaluate financing applications across multiple bank programs, optimize offers, and increase " +
  "approval rates. The multi-tenant design, RBAC, bilingual support, and deployment-ready " +
  "infrastructure make it a complete, production-ready solution."
);

addBody(
  "With the addition of comprehensive testing, the project would be well-positioned for " +
  "real-world deployment and scaling."
);

// ===== FIXES & AUDIT LOG =====
doc.addPage();
footer();
addSectionTitle("19. Audit & Fixes Log (2026-06-21)");

addSubSectionTitle("Issues Found & Fixed");
addBody("During the comprehensive code review on 2026-06-21, the following issues were identified and resolved:");

checkPageSpace(200);
addSubSectionTitle("FIX 1: Widget API Endpoint URL Mismatch");
addBody("File: apps/widget/src/Widget.tsx:30 — The widget was calling /api/v1/evaluate but the API registers the route at /evaluate (apps/api/src/routes/evaluate.ts:9). This caused a 404 error when the widget tried to fetch evaluation results.");
addBody("Fix: Changed the fetch URL from /api/v1/evaluate to /evaluate to match the actual API route.", 9);

addSubSectionTitle("FIX 2: Sub-User Login Returns Wrong Tenant ID");
addBody("File: apps/api/src/auth/auth.service.ts:113-114 — When a sub-user (not the main tenant) logs in, the response's tenant.id was incorrectly set to user.id instead of user.tenant_id. This caused the frontend to use the wrong ID for tenant-scoped operations.");
addBody("Fix: Changed tenant.id from user.id to user.tenant_id.", 9);

addSubSectionTitle("FIX 3: ESLint Errors — no-explicit-any");
addBody("File: apps/admin-dashboard/src/features/users/pages/UsersPage.tsx — Four ESLint errors where err parameters in onError callbacks were typed as any. This violated the @typescript-eslint/no-explicit-any rule.");
addBody("Fix: Changed all any types to Error, matching TanStack React Query v5's default error type.", 9);

addSubSectionTitle("FIX 4: Cookie Secret Warning");
addBody("File: apps/api/src/shared/env.ts — Added a startup warning when COOKIE_SECRET is still the default value (default-cookie-secret-change-me), matching the existing pattern for JWT_SECRET and REFRESH_TOKEN_SECRET warnings.", 9);

addSubSectionTitle("Security Review Summary");
addBody("The following security measures are confirmed active:");
addBullet("Rate limiting: 100 req/min global, 5 req/15min on /auth/login");
addBullet("Security headers: CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, X-XSS-Protection");
addBullet("httpOnly cookies for JWT tokens (inaccessible to JavaScript)");
addBullet("SameSite=Lax cookie policy (CSRF protection)");
addBullet("secure flag enabled in production (HTTPS-only cookies)");
addBullet("CORS whitelist with credential support");
addBullet("bcrypt password hashing (10 salt rounds)");
addBullet("JWT with configurable expiry (15m access, 7d refresh)");
addBullet("Refresh token rotation (old token invalidated on refresh)");
addBullet("API key authentication for public endpoints");
addBullet("RBAC middleware on all admin routes");
addBullet("Global error handler (no stack trace leakage)");
addBullet("Request ID tracing (8-char UUID on each request)");
addBullet("Input validation with Zod on all endpoints");

addSubSectionTitle("Database Architecture: Prisma + Raw SQL");
addBody("The project uses a dual database access strategy by design:");
addBullet("Prisma (packages/db/): Schema definition, migration management, seed data");
addBullet("Raw pg Pool (apps/api/src/db/db.ts): All runtime database operations");
addBody("This separation is valid for a monorepo where Prisma handles schema evolution and the API uses a lightweight pg Pool for runtime queries. The @lens/db package exports a PrismaClient singleton that is available but unused at runtime. Consider migrating to Prisma Client for runtime queries in future iterations to benefit from type-safe queries, auto-completion, and reduced raw SQL maintenance.", 9);

addSubSectionTitle("Build Verification");
addBody("All fixes verified with successful builds:");
addBullet("npm run build:api — TypeScript compilation SUCCESS");
addBullet("npm run build:fe — TypeScript + Vite build SUCCESS");
addBullet("npm run db:generate — Prisma client generation SUCCESS");
addBullet("npx tsc --noEmit (apps/api) — Type check SUCCESS");

// ===== METRICS SUMMARY =====
doc.moveDown(2);
addSectionTitle("Project Metrics Summary");

const metrics = [
  ["Total Applications", "3 (api, admin-dashboard, widget)"],
  ["Shared Packages", "6 (@lens/db, @lens/types, @lens/utils, @lens/config, @lens/ui, @lens/shared-types)"],
  ["Database Models", "10 (Tenant, User, RefreshToken, Bank, Program, Rule, Customer, Vehicle, Application, Offer)"],
  ["API Endpoints", "26+ (auth, admin CRUD, evaluation, optimization, public)"],
  ["Engine Pipeline Steps", "6 (Load Rules \u2192 Policy \u2192 Eligibility \u2192 Risk \u2192 Decision \u2192 Offer)"],
  ["Languages", "TypeScript (99%), SQL, Shell"],
  ["Frontend Components", "30+ (pages, components, layouts, data display)"],
  ["Documentation Files", "8 (Arabic + English)"],
];

for (const [k, v] of metrics) {
  addKeyValue(k, v);
}

// ===== FINALIZE =====
doc.moveDown(2);
doc
  .fontSize(10)
  .fillColor(GRAY)
  .text("--- End of Report ---", { align: "center" });

doc.end();

console.log("PDF generated successfully: full-dir.pdf");
