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
  // ignore ts rule until we add a handler for zod errors
  // eslint-disable-next-line no-useless-catch
  try {
    return schema.parse(body);
  } catch (error) {
    // Do something with the error
    throw error;
  }
}
