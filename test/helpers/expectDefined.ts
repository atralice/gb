import { expect } from "bun:test";

// Calls expect and returns the value with a non-null assertion to allow further use without type warnings.
export function expectDefined<T, NarrowedType extends T>(
  value: T | undefined,
  typeGuard?: (value: T) => value is NarrowedType,
  customFailMessage?: string
): asserts value is NarrowedType {
  expect(value, customFailMessage).toBeDefined();

  if (typeGuard && value !== undefined && !typeGuard(value)) {
    throw new Error("Value did not match the specified type");
  }
}

export function expectDefinedNotNull<T>(
  value: T | undefined | null
): asserts value is NonNullable<T> {
  expectDefined(value, (val): val is NonNullable<T> => val !== null);
}

export function expectString(value: unknown): asserts value is string {
  expect(value).toBeString();
}

export function expectInstanceOf<T>(
  value: unknown,
  constructor: new (...args: any[]) => T
): asserts value is T {
  expect(value).toBeInstanceOf(constructor);
}

export function expectHasProperty<K extends string, T extends object>(
  value: T,
  key: K
): asserts value is T & Record<K, unknown> {
  expect(key in value, `Expected object to have property "${key}"`).toBe(true);
}

export function expectDate(value: unknown): Date {
  expect(value).toBeInstanceOf(Date);
  if (!(value instanceof Date)) {
    throw new Error("Expected value to be a Date");
  }
  expect(Number.isNaN(value.getTime()), "Expected valid Date").toBe(false);
  return value;
}
