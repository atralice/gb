/**
 * Converts a record of key-value pairs into a URL query string.
 * Handles arrays, undefined, and null values appropriately.
 *
 * @param params - An optional record of parameters to be converted into a query string.
 * @returns A string starting with "?" containing the encoded query parameters, or an empty string if no parameters are provided.
 */
export default function buildQueryParams(
  params?: Record<string, string | number | boolean | string[]>
): string {
  if (!params) return "";

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else {
        query.append(key, value.toString());
      }
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}
