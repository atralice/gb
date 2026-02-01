import { expect } from "bun:test";
import { isServerActionError } from "@/lib/serverActions/isServerActionError";
import type { ServerActionError } from "@/lib/serverActions/serverActionError";

export function expectServerActionError<T>(
  result: T
): asserts result is Extract<T, ServerActionError> {
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expect(isServerActionError(result)).toBe(true);
}
