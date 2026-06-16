import pg from "pg";

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

function resolvePoolConfig(): pg.PoolConfig {
  const sslMode = process.env.PGSSLMODE || "";

  if (process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL;
    // Only inject sslmode if PGSSLMODE is explicitly set and not already in URL
    if (sslMode && !url.includes("sslmode=")) {
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}sslmode=${sslMode}`;
    }
    return {
      connectionString: url,
      max: isProduction ? 20 : 10,
      idleTimeoutMillis: isProduction ? 30000 : 10000,
      connectionTimeoutMillis: isProduction ? 10000 : 5000,
    };
  }

  const ssl = sslMode === "require" ? { rejectUnauthorized: true }
    : sslMode === "no-verify" || sslMode === "prefer" ? { rejectUnauthorized: false }
    : sslMode === "disable" ? undefined
    : undefined;

  const cfg: pg.PoolConfig = {
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
    cfg.user ??= "postgres";
    cfg.host ??= "localhost";
    cfg.database ??= "car_financing_system";
    cfg.password ??= "admin123";
    cfg.ssl = undefined;
  }

  if (isProduction && !cfg.password) {
    throw new Error("DB_PASSWORD environment variable is required in production");
  }

  if (isProduction && !cfg.user) {
    throw new Error("DB_USER environment variable is required in production");
  }

  return cfg;
}

const poolConfig = resolvePoolConfig();

export const db = new Pool(poolConfig);

db.on("error", (err) => {
  console.error("Unexpected DB Error:", err);
});

db.on("connect", () => {
  console.log("New DB connection established");
});
