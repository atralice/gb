import assertEnv from "./assertEnv";

const ENVIRONMENTS = ["development", "staging", "production"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

// Type guard to check if a value is a valid Environment
function isEnvironment(value: string): value is Environment {
  return ENVIRONMENTS.some((env) => env === value);
}

const rawNextPublicAppEnv = assertEnv(
  "NEXT_PUBLIC_APP_ENV",
  process.env.NEXT_PUBLIC_APP_ENV
);

if (!isEnvironment(rawNextPublicAppEnv)) {
  throw new Error(
    `Environment variable 'NEXT_PUBLIC_APP_ENV' is not included in the list of allowed values for ENVIRONMENTS: ${ENVIRONMENTS.join(
      ", "
    )}`
  );
}

export const NEXT_PUBLIC_APP_ENV: Environment = rawNextPublicAppEnv;

export const env = (env: Environment) => NEXT_PUBLIC_APP_ENV === env;

export const pickForEnv = <T>(envUrls: Record<Environment, T>): T => {
  return envUrls[NEXT_PUBLIC_APP_ENV];
};

// for fetch requests to the old Rails backend
export const BACKEND_BASE_URL = pickForEnv({
  development: "http://localhost:3000",
  staging: "https://localhost:3000",
  production: "https://localhost:3000",
});

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
