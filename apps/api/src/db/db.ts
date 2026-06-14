import pg from "pg";

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

const poolConfig: pg.PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  max: isProduction ? 20 : 10,
  idleTimeoutMillis: isProduction ? 30000 : 10000,
  connectionTimeoutMillis: isProduction ? 10000 : 5000,
};

if (!isProduction) {
  poolConfig.user ??= "postgres";
  poolConfig.host ??= "localhost";
  poolConfig.database ??= "car_financing_system";
  poolConfig.password ??= "admin123";
}

if (isProduction && !poolConfig.password) {
  throw new Error("DB_PASSWORD environment variable is required in production");
}

if (isProduction && !poolConfig.user) {
  throw new Error("DB_USER environment variable is required in production");
}

export const db = new Pool(poolConfig);

db.on("error", (err) => {
  console.error("Unexpected DB Error:", err);
});

db.on("connect", () => {
  console.log("New DB connection established");
});
