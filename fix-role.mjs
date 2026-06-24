import pg from "pg";
const pool = new pg.Pool({
  connectionString: "postgresql://postgres:yxQDVfoItWskBvxfzVKOvfpymqXrBtFk@thomas.proxy.rlwy.net:30988/railway",
});
await pool.query("UPDATE tenants SET role = 'ADMIN' WHERE email = 'admin@lens-iq.com'");
const { rows } = await pool.query("SELECT id, name, email, role FROM tenants");
console.table(rows);
await pool.end();
