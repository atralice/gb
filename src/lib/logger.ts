import { env } from "@/env.config";

// Simple logger utilities for boilerplate
export function log(...args: unknown[]) {
  if (env.NODE_ENV === "test") return;
  console.log("[LOG]", ...args);
}

export function logError(...args: unknown[]) {
  if (env.NODE_ENV === "test") return;
  console.error("[ERROR]", ...args);
}
