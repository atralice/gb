import { z } from "zod";
import { expect } from "bun:test";

type ZodErrorExpectation = {
  path: string[];
  message: string | RegExp;
};

type ZodValidationResult = {
  success: boolean;
  error?: z.ZodError;
};

function isZodValidationResult(value: unknown): value is ZodValidationResult {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    typeof value.success === "boolean"
  );
}

expect.extend({
  toHaveZodErrors(received: unknown, expected: ZodErrorExpectation[]) {
    if (!isZodValidationResult(received)) {
      return {
        message: () => "Expected received value to be a Zod validation result",
        pass: false,
      };
    }

    const result = received;
    if (result.success) {
      return {
        message: () => "Expected validation to fail but it succeeded",
        pass: false,
      };
    }

    const error = result.error;
    if (!error) {
      return {
        message: () =>
          "Expected validation to fail with errors but got no error",
        pass: false,
      };
    }

    const issues = error.issues.flatMap((issue) => {
      if ("unionErrors" in issue && Array.isArray(issue.unionErrors)) {
        return issue.unionErrors.flatMap((err: z.ZodError) => err.issues);
      }
      return [issue];
    });

    if (issues.length === 0) {
      return {
        message: () =>
          "Expected validation to fail with errors but got no issues",
        pass: false,
      };
    }

    const missingErrors = expected.filter((expectedError) => {
      return !issues.some((issue) => {
        const pathMatches =
          JSON.stringify(issue.path) === JSON.stringify(expectedError.path);
        const messageMatches =
          expectedError.message instanceof RegExp
            ? expectedError.message.test(issue.message)
            : issue.message === expectedError.message;
        return pathMatches && messageMatches;
      });
    });

    if (missingErrors.length > 0) {
      return {
        message: () =>
          `Expected validation to fail with errors:\n${JSON.stringify(
            missingErrors,
            null,
            2
          )}\nBut got:\n${JSON.stringify(issues, null, 2)}`,
        pass: false,
      };
    }

    return {
      message: () => "Expected validation to fail with different errors",
      pass: true,
    };
  },
});
