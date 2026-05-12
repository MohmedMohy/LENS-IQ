// src/db/db.ts

import pg from "pg";

const { Pool } = pg;

export const db = new Pool({
  user: process.env.DB_USER ?? "postgres",
  host: process.env.DB_HOST ?? "localhost",
  database: process.env.DB_NAME ?? "car_financing_system",
  password: process.env.DB_PASSWORD ?? "admin123",
  port: Number(process.env.DB_PORT) || 5432,
});

db.on("error", (err) => {
  console.error("🔥 Unexpected DB Error:", err);
});