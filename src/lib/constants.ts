import { env as envConfig } from "@/env.config";

const ENVIRONMENTS = ["development", "staging", "production"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

export const NEXT_PUBLIC_APP_ENV: Environment = envConfig.NEXT_PUBLIC_APP_ENV;

export const env = (environment: Environment) =>
  NEXT_PUBLIC_APP_ENV === environment;

export const pickForEnv = <T>(envUrls: Record<Environment, T>): T => {
  return envUrls[NEXT_PUBLIC_APP_ENV];
};

export const FRONTEND_BASE_URLS = {
  development: "http://localhost:3000",
  staging: "https://localhost:3000",
  production: "https://localhost:3000",
};

export const FRONTEND_BASE_URL = pickForEnv(FRONTEND_BASE_URLS);

export function urlFor(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${FRONTEND_BASE_URL}${normalizedPath}`;
}

export const DATE_FORMAT = "d MMM, yyyy";
