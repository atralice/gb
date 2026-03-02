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
type ErrorConstructor = new (...args: never[]) => Error;

function catchErrors<T>(
  fn: () => T,
  errorsToHandle?: ErrorConstructor[]
): T | undefined;
function catchErrors<T>(
  fn: () => Promise<T>,
  errorsToHandle?: ErrorConstructor[]
): Promise<T | undefined>;
function catchErrors<T>(
  fn: () => T | Promise<T>,
  errorsToHandle?: ErrorConstructor[]
): T | undefined | Promise<T | undefined> {
  const handleError = (error: unknown): undefined => {
    if (
      !errorsToHandle ||
      errorsToHandle.some((ErrorClass) => error instanceof ErrorClass)
    ) {
      captureException(error);
      return undefined;
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
