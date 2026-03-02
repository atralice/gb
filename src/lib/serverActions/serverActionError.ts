export type ServerActionFlattenedError = {
  readonly fieldErrors: Record<string, string[]>;
  readonly formErrors: string[];
};

export type ServerActionError = {
  readonly success: false;
  readonly error: ServerActionFlattenedError;
};

export function toFieldErrors(
  errors: Record<string, string[] | undefined>
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value && value.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

export function serverActionError({
  fieldErrors,
  formErrors,
}: {
  readonly fieldErrors?: Record<string, string[]>;
  readonly formErrors?: string[];
}): ServerActionError {
  return {
    success: false,
    error: {
      fieldErrors: fieldErrors ?? {},
      formErrors: formErrors ?? [],
    },
  };
}
