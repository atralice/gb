/**
 * Assert that an environment variable is set and return its value.
 * You need to pass in the value even though it seems like you could read it dynamically in this function
 * because otherwise the constant is not set during compilation and all will be `undefined` at runtime.
 */
export default function assertEnv(
  key: string,
  value: string | undefined
): string {
  if (value === undefined || value === "")
    throw new Error(`Environment variable ${key} not set`);

  return value;
}
