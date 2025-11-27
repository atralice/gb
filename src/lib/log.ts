import { env as appEnv } from "./constants";
import { env } from "@/env.config";

// by default, log in all environments but test (except if DEBUG is set)
const shouldLog = () =>
  env.DEBUG || env.NEXT_PUBLIC_PLAYWRIGHT || appEnv("development");

const log = (...args: unknown[]) => {
  if (shouldLog()) {
    console.log(...args);
  }
};

const error = (...args: unknown[]) => {
  if (shouldLog()) {
    console.error(...args);
  }
};

const warn = (...args: unknown[]) => {
  if (shouldLog()) {
    console.warn(...args);
  }
};

export { log, error, warn };
