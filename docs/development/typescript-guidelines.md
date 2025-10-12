# TypeScript Guidelines

## Core Principles

- Prefer `type` over `interface` for type definitions
- Use Prisma-generated types for database models and enums
- **DO NOT USE** `any` in types
- **DO NOT USE** `as` for type casting unless absolutely necessary
- **DO NOT USE** `!` (non-null assertion operator)
- In most cases, prefer not to explicitly state the return type of a function
- For type narrowing, use the custom functions `@expectDefined` and `@expectDefinedNotNull`

## Best Practices

- Always use proper enum values directly (e.g., `TaskType.enumValue`) instead of string literals with type assertions (`"enumValue" as TaskType`)
- When creating helper functions that work with database models, always use proper types from Prisma instead of `any` for function parameters and return types
- Never silence a noUnusedLocals / noUnusedParameters error by prefixing an identifier with an underscore (e.g. _foo). This masks real problems and can introduce dead code or logical bugs.

## Type Narrowing

Instead of using type assertions or non-null assertions, use the custom utility functions:
- `@expectDefined` - for ensuring a value is not undefined
- `@expectDefinedNotNull` - for ensuring a value is neither undefined nor null

## Related Documentation

- [Error Handling](./error-handling.md)
- [Code Style](./code-style.md)
- [API Route Structure](../api/route-structure.md)
