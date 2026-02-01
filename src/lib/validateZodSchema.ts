import { ZodSchema } from "zod";

type ValidateZodSchemaParams<T> = {
  body: any;
  schema: ZodSchema<T>;
};

// stringify zod errors so we see the full error in Sentry instead of a truncated version
export default function parseZodSchema<T>({
  body,
  schema,
}: ValidateZodSchemaParams<T>): T {
  return schema.parse(body);
}
