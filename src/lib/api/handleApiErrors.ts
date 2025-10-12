import { z } from "zod";
import { ValidationError, NotFoundError } from "src/types/errors";

// Example: adapt this to your framework's error response pattern
const handleApiErrors = (error: unknown, res: any) => {
  if (error instanceof z.ZodError || error instanceof ValidationError) {
    return (
      res.unprocessableEntity({ error: error.message }) ??
      res.status(422).json({ error: error.message })
    );
  }
  if (error instanceof NotFoundError) {
    return (
      res.notFound({ error: error.message }) ??
      res.status(404).json({ error: error.message })
    );
  }
  // Fallback for all other errors
  return (
    res.serverError({ error: "Internal server error" }) ??
    res.status(500).json({ error: "Internal server error" })
  );
};

export default handleApiErrors;
