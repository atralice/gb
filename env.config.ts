import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SHADOW_DATABASE_URL: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]),
  NEXT_PUBLIC_PLAYWRIGHT: z.string().optional(),
  DEBUG: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

function loadEnvConfig(): EnvConfig {
  const rawEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_PLAYWRIGHT: process.env.NEXT_PUBLIC_PLAYWRIGHT,
    DEBUG: process.env.DEBUG,
  };
  return envSchema.parse(rawEnv);
}

export const env = loadEnvConfig();
