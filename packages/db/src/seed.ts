import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  const apiKey = crypto.randomBytes(32).toString("hex");
  const apiKeyHash = hashApiKey(apiKey);

  const tenant = await prisma.tenant.upsert({
    where: { email: "admin@lens-iq.com" },
    update: {},
    create: {
      name: "Admin Dealer",
      email: "admin@lens-iq.com",
      password_hash: passwordHash,
      api_key_hash: apiKeyHash,
      role: "ADMIN",
      active: true,
    },
  });

  const bank = await prisma.bank.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: "بنك مصر",
      code: "BANQUE_MISR",
      logo_url: null,
      active: true,
    },
  });

  const bank2 = await prisma.bank.upsert({
    where: { id: 2 },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: "البنك الأهلي المصري",
      code: "NBE",
      logo_url: null,
      active: true,
    },
  });

  // ============================================
  // Program 1: Salary Transfer Program
  // ============================================
  const salaryTransferProgram = await prisma.program.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: "برنامج تحويل الراتب",
      code: "SALARY_TRANSFER",
      description: "برنامج تمويل مخصص للموظفين المحول رواتبهم",
      customer_types: ["salary_transfer"],
      priority: 1,
      required_documents: ["national_id", "salary_certificate", "bank_statement_6months"],
      financing_type: "conventional",
      calculation_method: "reducing",
      min_salary: 5000,
      max_customer_age: 60,
      salary_transfer_required: true,
      max_car_age: 10,
      allowed_conditions: "both",
      max_vehicle_price: null,
      interest_rate: 14.5,
      profit_rate: null,
      min_months: 12,
      max_months: 84,
      min_down_payment_percent: 20,
      max_down_payment_percent: 100,
      max_finance_amount: null,
      admin_fees_percent: 1,
      active: true,
    },
  });

  // Link banks to Salary Transfer Program
  await prisma.$executeRawUnsafe(
    `INSERT INTO program_banks (program_id, bank_id, interest_rate, profit_rate, min_months, max_months, min_down_payment_percent, max_down_payment_percent, max_finance_amount, admin_fees_percent, max_car_age, max_vehicle_price, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (program_id, bank_id) DO NOTHING`,
    [salaryTransferProgram.id, bank.id, 14.5, null, 12, 84, 20, 100, null, 1, 10, null, true]
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO program_banks (program_id, bank_id, interest_rate, profit_rate, min_months, max_months, min_down_payment_percent, max_down_payment_percent, max_finance_amount, admin_fees_percent, max_car_age, max_vehicle_price, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (program_id, bank_id) DO NOTHING`,
    [salaryTransferProgram.id, bank2.id, 12, 12, 12, 60, 30, 100, 1500000, 0.5, 7, 2000000, true]
  );

  // ============================================
  // Program 2: Employees Program
  // ============================================
  const employeesProgram = await prisma.program.upsert({
    where: { id: 2 },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: "برنامج الموظفين",
      code: "EMPLOYEES",
      description: "برنامج تمويل لموظفي الحكومة والقطاعين العام والخاص",
      customer_types: ["employee"],
      priority: 2,
      required_documents: ["national_id", "salary_certificate", "employment_letter", "bank_statement_3months"],
      financing_type: "islamic",
      calculation_method: "murabaha",
      min_salary: 8000,
      max_customer_age: 65,
      salary_transfer_required: false,
      max_car_age: 7,
      allowed_conditions: "new",
      max_vehicle_price: 2000000,
      interest_rate: 0,
      profit_rate: 12,
      min_months: 12,
      max_months: 60,
      min_down_payment_percent: 30,
      max_down_payment_percent: 100,
      max_finance_amount: 1500000,
      admin_fees_percent: 0.5,
      active: true,
    },
  });

  // Link banks to Employees Program
  await prisma.$executeRawUnsafe(
    `INSERT INTO program_banks (program_id, bank_id, interest_rate, profit_rate, min_months, max_months, min_down_payment_percent, max_down_payment_percent, max_finance_amount, admin_fees_percent, max_car_age, max_vehicle_price, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (program_id, bank_id) DO NOTHING`,
    [employeesProgram.id, bank.id, 0, 12, 12, 60, 30, 100, 1500000, 0.5, 7, 2000000, true]
  );

  // ============================================
  // Rules for Programs
  // ============================================
  // Salary Transfer Program rules
  await prisma.rule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tenant_id: tenant.id,
      program_id: salaryTransferProgram.id,
      scope: "PROGRAM",
      field: "salary_transfer",
      operator: "=",
      value: "true",
      action: "REQUIRED",
      priority: 1,
    },
  });

  // Employees Program rules
  await prisma.rule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      tenant_id: tenant.id,
      program_id: employeesProgram.id,
      scope: "PROGRAM",
      field: "customer_type",
      operator: "=",
      value: "employee",
      action: "REQUIRED",
      priority: 1,
    },
  });

  console.log("Seed completed successfully");
  console.log(`  Tenant: ${tenant.email} / admin123`);
  console.log(`  API Key: ${apiKey}`);
  console.log(`  API Key (masked): ${apiKey.slice(0, 8)}...`);
  console.log(`  Banks: ${bank.name}, ${bank2.name}`);
  console.log(`  Programs: ${salaryTransferProgram.name}, ${employeesProgram.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
