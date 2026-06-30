import { db } from "../db/db.js";
import type { Program } from "../shared/types/program.js";
import type { ProgramRow } from "../shared/types/database.js";
import { mapProgram } from "../mappers/program.mapper.js";

async function attachBanksToProgram(program: Program, tenantId: number): Promise<Program> {
    const result = await db.query(
        `SELECT pb.*, b.name AS bank_name
         FROM program_banks pb
         JOIN banks b ON b.id = pb.bank_id
         WHERE pb.program_id = $1 AND pb.active = true
         ORDER BY pb.bank_id`,
        [program.id]
    );

    const banks = result.rows.map((row: any) => ({
        programId: Number(row.program_id),
        bankId: Number(row.bank_id),
        interestRate: Number(row.interest_rate) || 0,
        profitRate: row.profit_rate ? Number(row.profit_rate) : null,
        minMonths: Number(row.min_months) || 12,
        maxMonths: Number(row.max_months) || 12,
        minDownPaymentPercent: Number(row.min_down_payment_percent) || 0,
        maxDownPaymentPercent: Number(row.max_down_payment_percent) || 100,
        maxFinanceAmount: row.max_finance_amount ? Number(row.max_finance_amount) : null,
        adminFeesPercent: Number(row.admin_fees_percent) || 0,
        maxCarAge: Number(row.max_car_age) || 0,
        maxVehiclePrice: row.max_vehicle_price ? Number(row.max_vehicle_price) : null,
        maxLtvPercent: row.max_ltv_percent ? Number(row.max_ltv_percent) : undefined,
        active: Boolean(row.active),
        bankName: row.bank_name || undefined,
    }));

    return { ...program, banks };
}

export async function getPrograms(
  tenantId: number
): Promise<Program[]> {
  const result = await db.query(
    `SELECT * FROM programs WHERE active = true AND tenant_id = $1 ORDER BY id DESC`,
    [tenantId]
  );
  const programs: Program[] = result.rows.map((row: ProgramRow) => mapProgram(row));
  const withBanks = await Promise.all(programs.map(p => attachBanksToProgram(p, tenantId)));
  return withBanks;
}

export async function getProgramsByCustomerType(
  tenantId: number,
  customerType: string
): Promise<Program[]> {
  const result = await db.query(
    `SELECT * FROM programs 
     WHERE active = true AND tenant_id = $1 
       AND $2 = ANY(customer_types)
      ORDER BY id DESC`,
    [tenantId, customerType]
  );
  const programs: Program[] = result.rows.map((row: ProgramRow) => mapProgram(row));
  const withBanks = await Promise.all(programs.map(p => attachBanksToProgram(p, tenantId)));
  return withBanks;
}
