import pg from "pg";

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

function shouldUseSsl(): pg.PoolConfig["ssl"] {
  // Explicit override via PGSSLMODE env var
  const sslMode = process.env.PGSSLMODE;
  if (sslMode === "require") return { rejectUnauthorized: true };
  if (sslMode === "no-verify" || sslMode === "prefer") return { rejectUnauthorized: false };
  if (sslMode === "disable") return undefined;

  // Auto-detect from DATABASE_URL
  const url = process.env.DATABASE_URL || "";
  if (url.includes("sslmode=require") || url.includes("sslmode=no-verify")) {
    return { rejectUnauthorized: url.includes("sslmode=no-verify") };
  }

  // Railway internal — their Postgres supports SSL
  if (url.includes(".railway")) return { rejectUnauthorized: false };

  // Production default: try SSL
  if (isProduction) return { rejectUnauthorized: false };

  return undefined;
}

const ssl = shouldUseSsl();

let poolConfig: pg.PoolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: isProduction ? 20 : 10,
    idleTimeoutMillis: isProduction ? 30000 : 10000,
    connectionTimeoutMillis: isProduction ? 10000 : 5000,
    ssl,
  };
} else {
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    max: isProduction ? 20 : 10,
    idleTimeoutMillis: isProduction ? 30000 : 10000,
    connectionTimeoutMillis: isProduction ? 10000 : 5000,
    ssl,
  };

  if (!isProduction) {
    poolConfig.user ??= "postgres";
    poolConfig.host ??= "localhost";
    poolConfig.database ??= "car_financing_system";
    poolConfig.password ??= "admin123";
    poolConfig.ssl = undefined;
  }

  if (isProduction && !poolConfig.password) {
    throw new Error("DB_PASSWORD environment variable is required in production");
  }

  if (isProduction && !poolConfig.user) {
    throw new Error("DB_USER environment variable is required in production");
  }
}

export const db = new Pool(poolConfig);

db.on("error", (err) => {
  console.error("Unexpected DB Error:", err);
});

db.on("connect", () => {
  console.log("New DB connection established");
});
