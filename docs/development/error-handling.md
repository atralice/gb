# Error Handling

## catchErrors Utility

Use the `catchErrors` utility (`@/lib/errors/catchErrors`) to wrap code that may throw errors, especially when you want to:

- Catch and handle only specific error types (e.g., `[ValidationError]`)
- Raise the visibility of caught errors by sending them to Sentry

### Usage Examples

```typescript
// Catches only ValidationError and logs/sends to Sentry, rethrows others
catchErrors(() => riskyOperation(), [ValidationError]);

// Catches all errors
catchErrors(() => riskyOperation());
```

- If the error is not in the list of handled types, it will be rethrown.
- Prefer using `catchErrors` over manual try/catch blocks for simplicity and Sentry integration.

## ValidationError

`ValidationError` is a custom error class used throughout the codebase to indicate validation failures (e.g., invalid input, failed preconditions, or business rule violations).

### When to Use ValidationError

- It is typically thrown when a function detects invalid data that should be handled gracefully, rather than crashing the application.
- **Best practice:** Throw `ValidationError` for errors that are expected and can be handled by the caller (e.g., user input errors, invalid state transitions). For unexpected or critical errors, throw a different error type.
- In most cases, `ValidationError` is caught by the caller and handled appropriately (e.g., by returning a user-friendly error message, logging, or skipping further processing).

## Related Documentation

- [TypeScript Guidelines](./typescript-guidelines.md)
- [Code Style](./code-style.md)
- [Testing Best Practices](../testing/testing-best-practices.md)
