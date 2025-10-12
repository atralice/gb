import "dotenv/config";
import z from "zod";

import validateZodSchema from "./validateZodSchema";

// validate env variables
const envSchema = z.object({
  PORT: z.string(),
  DATABASE_URL: z.string(),
  APP_ENV: z.enum(["development", "production", "test"]),
});

export const validatedEnvs = validateZodSchema({
  body: {
    PORT: process.env.PORT || "3000",
    ...process.env,
  },
  schema: envSchema,
});

// Export individual environment variables
export const { PORT, DATABASE_URL, APP_ENV } = validatedEnvs;
