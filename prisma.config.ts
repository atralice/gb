import { defineConfig, env as prismaEnv } from "prisma/config";
import { env } from "./env.config";

export default defineConfig({
  datasource: {
    url: env.DATABASE_URL,
    shadowDatabaseUrl: env.SHADOW_DATABASE_URL,
  },
});
