import pg from "pg";
const { Pool } = pg;
const p = new Pool({
  connectionString: "postgresql://postgres:yxQDVfoItWskBvxfzVKOvfpymqXrBtFk@thomas.proxy.rlwy.net:30988/railway",
  connectionTimeoutMillis: 5000,
});
try {
  const r = await p.query("SELECT 1 as ok");
  console.log("DB OK:", r.rows[0].ok);
  const b = await p.query(
    `SELECT b.*, '[]'::json AS supported_program_ids FROM banks b WHERE b.tenant_id = $1 ORDER BY b.id DESC`,
    [1]
  );
  console.log("Banks count:", b.rows.length);
  if (b.rows.length > 0) console.log("First bank:", b.rows[0].name);
} catch (e: any) {
  console.error("ERR:", e.message);
}
await p.end();
