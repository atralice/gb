import { expect } from "bun:test";

// Calls expect and returns the value with a non-null assertion to allow further use without type warnings.
export function expectDefined<T, NarrowedType extends T>(
  value: T | undefined,
  typeGuard?: (value: T) => value is NarrowedType,
  customFailMessage?: string
): asserts value is NarrowedType {
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expect(value, customFailMessage).toBeDefined();

  if (typeGuard && value !== undefined && !typeGuard(value)) {
    throw new Error("Value did not match the specified type");
  }
}

export function expectDefinedNotNull<T>(
  value: T | undefined | null
): asserts value is NonNullable<T> {
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expectDefined(value, (val): val is NonNullable<T> => val !== null);
}

export function expectString(value: unknown): asserts value is string {
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expect(value).toBeString();
}

export function expectInstanceOf<T>(
  value: unknown,
  constructor: new (...args: any[]) => T
): asserts value is T {
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expect(value).toBeInstanceOf(constructor);
}
