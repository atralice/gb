import { captureException } from "./captureException";

/**
 * Catch specified errors, log them to console, send to Sentry
 * Throw any unhandled error types.
 *
 * @example
 * // Catch all errors
 * catchErrors(() => riskyOperation())
 * // Catch only ValidationError
 * catchErrors(() => riskyOperation(), [ValidationError])
 * // Catch all errors in async function
 * catchErrors(async () => await asyncOperation())
 *
 * @param fn A function that may throw an error, can be sync or async
 * @param errorsToHandle Array of error classes to handle. If undefined, catches all errors.
 */
function catchErrors<T>(
  fn: () => T,
  errorsToHandle?: (new (...args: any[]) => Error)[]
): T;
function catchErrors<T>(
  fn: () => Promise<T>,
  errorsToHandle?: (new (...args: any[]) => Error)[]
): Promise<T>;
function catchErrors<T>(
  fn: () => T | Promise<T>,
  errorsToHandle?: (new (...args: any[]) => Error)[]
): T | Promise<T> {
  const handleError = (error: unknown): T => {
    if (
      !errorsToHandle ||
      errorsToHandle.some((ErrorClass) => error instanceof ErrorClass)
    ) {
      captureException(error);
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return undefined as T;
    }
    throw error;
  };

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.catch(handleError);
    }
    return result;
  } catch (error) {
    return handleError(error);
  }
}

export default catchErrors;
