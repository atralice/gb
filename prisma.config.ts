import { defineConfig } from "prisma/config";
import { env } from "./env.config";

export default defineConfig({
  schema: "schema.prisma",
  migrations: {
    seed: "bun prisma/seed.ts",
    path: "migrations",
  },
  datasource: {
    url: env.DATABASE_URL,
    shadowDatabaseUrl: env.SHADOW_DATABASE_URL,
  },
});
