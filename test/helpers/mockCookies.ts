import { mock } from "bun:test";

/**
 * Creates a mock for Next.js's cookie functionality in tests.
 * This helper function mocks the 'next/headers' module's cookies() method
 * to return a Map of cookie key-value pairs based on the provided object.
 * Each cookie value is wrapped in an object with a 'value' property to
 * match Next.js's cookie interface.
 *
 * @param cookies - An object containing cookie key-value pairs to mock
 * @returns A mock module for 'next/headers' with the cookies() function
 */
export default function mockCookies(cookies: Record<string, any>) {
  return mock.module("next/headers", () => ({
    cookies: () => {
      const cookieMap = new Map();
      for (const [key, value] of Object.entries(cookies)) {
        cookieMap.set(key, { value });
      }
      return cookieMap;
    },
  }));
}
