type UserFacingErrorParams = {
  code: string;
  sentryMessage: string;
  userMessage: string;
};

// IMPORTANT: If you modify the UserFacingError constructor or add/remove properties,
// you must update the property checks in isUserFacingError to match.
export class UserFacingError extends Error {
  public readonly code: string;
  public readonly userMessage: string;

  constructor({ code, sentryMessage, userMessage }: UserFacingErrorParams) {
    super(sentryMessage);
    this.name = this.constructor.name;
    this.code = code;
    this.userMessage = userMessage;
  }
}

// In production, Next.js serializes errors when they cross the server/client boundary,
// which breaks instanceof checks. This function handles both cases by checking for
// either a true UserFacingError instance or a serialized object with the same shape.
export function isUserFacingError(err: unknown): err is UserFacingError {
  if (!err || typeof err !== "object") {
    return false;
  }

  return (
    err instanceof UserFacingError ||
    ("name" in err && "code" in err && "userMessage" in err)
  );
}
