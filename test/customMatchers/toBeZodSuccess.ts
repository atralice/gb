import { expect } from "bun:test";

type ZodValidationResult = {
  success: boolean;
  error?: { issues: any[] };
};

/**
 * Type guard to check if an object is a ZodValidationResult
 */
const isZodValidationResult = (obj: unknown): obj is ZodValidationResult => {
  return typeof obj === "object" && obj !== null && "success" in obj;
};

expect.extend({
  toBeZodSuccess(received: unknown) {
    if (!isZodValidationResult(received)) {
      return {
        message: () => "Expected a Zod validation result object",
        pass: false,
      };
    }

    if (received.success) {
      return {
        message: () => "Expected validation to fail but it succeeded",
        pass: true,
      };
    }

    // If validation failed, provide a helpful error message with prettified errors
    const errorMessage = received.error
      ? received.error
      : "No error details available";

    return {
      message: () =>
        `Expected validation to succeed but it failed:\n${errorMessage}`,
      pass: false,
    };
  },
});
