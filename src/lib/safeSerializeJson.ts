/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { logError } from "@/lib/logger";
import { Prisma } from "@prisma/client";

type JsonValue = Prisma.InputJsonValue | null;

function sanitizeString(value: string): string {
  // Remove null bytes and other control characters
  return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
}

function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (typeof value === "object") {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function makeJsonSafe(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "function") return null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.map(makeJsonSafe) as JsonValue;
    if ("toJSON" in value && typeof value.toJSON === "function")
      return sanitizeObject(value.toJSON()) as JsonValue;

    const seen = new WeakSet<object>();
    return JSON.parse(
      JSON.stringify(value, (key, val) => {
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return undefined;
          seen.add(val);
        }
        return makeJsonSafe(val);
      })
    ) as JsonValue;
  }
  return value as JsonValue;
}

export function safeSerializeJson(value: unknown): Prisma.InputJsonValue {
  try {
    // First sanitize the value to remove problematic characters
    const sanitizedValue =
      typeof value === "object" ? sanitizeObject(value) : value;
    return JSON.parse(JSON.stringify(sanitizedValue)) as Prisma.InputJsonValue;
  } catch (error) {
    logError("Fallback to makeJsonSafe due to serialization issue:", error);
    const result = makeJsonSafe(value);
    return result ?? {}; // Return empty object if null
  }
}
