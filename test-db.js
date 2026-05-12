import pg from "pg";

const { Pool } = pg;

const db = new Pool({
    user: "postgres",
    host: "localhost",
    database: "car_financing_system",
    password: "admin123",
    port: 5432,
});

async function test() {
    try {
        const res = await db.query("SELECT NOW()");
        console.log("✅ DB CONNECTED:", res.rows);
    } catch (err) {
        console.error("❌ DB ERROR:", err);
    } finally {
        await db.end();
    }
}

test();