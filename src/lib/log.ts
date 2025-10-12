import { env } from "./constants";

// by default, log in all environments but test (except if DEBUG is set)
const shouldLog = () =>
  process.env.DEBUG || process.env.NEXT_PUBLIC_PLAYWRIGHT || env("development");

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
