import { logError } from "../logger";

export function captureException(error: unknown) {
  // TODO: Implement Sentry captureException
  logError("Operation failed:", error);
}
