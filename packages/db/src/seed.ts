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

  const program = await prisma.program.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tenant_id: tenant.id,
      bank_id: bank.id,
      name: "تمويل السيارات - بنك مصر",
      financing_type: "conventional",
      calculation_method: "reducing",
      min_salary: 5000,
      max_customer_age: 60,
      salary_transfer_required: false,
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

  const program2 = await prisma.program.upsert({
    where: { id: 2 },
    update: {},
    create: {
      tenant_id: tenant.id,
      bank_id: bank2.id,
      name: "تمويل السيارات - الأهلي",
      financing_type: "islamic",
      calculation_method: "murabaha",
      min_salary: 8000,
      max_customer_age: 65,
      salary_transfer_required: true,
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

  console.log("Seed completed successfully");
  console.log(`  Tenant: ${tenant.email} / admin123`);
  console.log(`  API Key: ${apiKey}`);
  console.log(`  API Key (masked): ${apiKey.slice(0, 8)}...`);
  console.log(`  Banks: ${bank.name}, ${bank2.name}`);
  console.log(`  Programs: ${program.name}, ${program2.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
