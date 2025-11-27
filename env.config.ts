import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Required environment variables
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.string().default("3000"),
  APP_ENV: z.enum(["development", "production", "test"]),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]),

  // Optional environment variables
  SHADOW_DATABASE_URL: z.string().optional(),
  DEBUG: z.string().optional(),
  NEXT_PUBLIC_PLAYWRIGHT: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

function loadEnvConfig(): EnvConfig {
  const rawEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT || "3000",
    APP_ENV: process.env.APP_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL,
    DEBUG: process.env.DEBUG,
    NEXT_PUBLIC_PLAYWRIGHT: process.env.NEXT_PUBLIC_PLAYWRIGHT,
    NODE_ENV: process.env.NODE_ENV,
  };
  return envSchema.parse(rawEnv);
}

export const env = loadEnvConfig();
