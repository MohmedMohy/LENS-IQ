export const CONFIG = {
  api: {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || "0.0.0.0",
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:5173",
      "http://localhost:4000",
      "http://localhost:3000",
    ],
  },
  jwt: {
    secret: process.env.JWT_SECRET || "change_me_in_production",
    expiresIn: "7d",
  },
  db: {
    url: process.env.DATABASE_URL || "",
  },
} as const;
