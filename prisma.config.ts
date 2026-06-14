import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "packages/db/prisma/schema.prisma",
  seed: "tsx packages/db/src/seed.ts",
});
