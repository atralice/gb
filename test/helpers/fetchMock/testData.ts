import { readFileSync } from "fs";
import path from "path";
import { merge } from "lodash";
import { z, ZodType } from "zod";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function testData<T extends ZodType>(
  subPath: string,
  schema: T,
  overrides?: DeepPartial<z.infer<T>>
): { rawData: unknown; parsedData: z.infer<T> };

export function testData<T extends ZodType>(
  subPath: string,
  schema: T
): { rawData: unknown; parsedData: z.infer<T> };

export function testData(subPath: string): {
  rawData: unknown;
  parsedData: undefined;
};

export function testData<T extends ZodType | undefined>(
  subPath: string,
  schema?: T,
  overrides?: DeepPartial<T extends ZodType ? z.infer<T> : never>
) {
  const filePath = path.join(process.cwd(), "test/fixtures", subPath);
  const baseData = JSON.parse(readFileSync(filePath, "utf-8"));
  const rawData = overrides ? merge(baseData, overrides) : baseData;
  const parsedData = schema?.parse(rawData);
  return { rawData, parsedData };
}
