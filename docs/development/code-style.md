# Code Style Guidelines

## General Principles

- We use yarn as our package manager
- Prefer object parameter style for function arguments instead of positional arguments
- Use TypeScript types for better code completion and safety
- Follow functional programming patterns where possible
- Extract validation functions for better testability and separation of concerns
- Always handle errors and edge cases explicitly
- Format numbers ≥ 1000 with underscores: `1_000` (for cents: `1_000_00`)
- Use yoda syntax with equality only
- For API routes, prefer helper functions like `success()` from `@/lib/api/jsonResponse.ts` over direct `NextResponse` usage
- For API routes, always use handleApiErrors from `@/lib/api/handleApiErrors.ts` to handle errors
- For API routes, always use validateZodSchema from `@/lib/utils/validateZodSchema.ts` to validate request bodies

## React Guidelines

- For React components, prefer plain functions over using React.FC
- You MUST define event handler functions using useCallback instead of writing inline anonymous functions directly inside JSX props like onSubmit={(e) => { ... }}.

## Naming Conventions

- Test files should contain descriptive test names matching the functionality
- Use object property style for function parameters
- Use descriptive variable/parameter names that indicate data types

## Dependencies

**IMPORTANT:** You MUST ask before adding any new dependencies to the project. Always look for existing solutions within the codebase first, and if a new dependency is truly needed, get explicit confirmation before adding it to package.json

## Linting

**IMPORTANT:** Always run linting (`yarn lint`) before submitting changes. Linting is a critical part of our development workflow and must be part of your routine

## Related Documentation

- [TypeScript Guidelines](./typescript-guidelines.md)
- [Error Handling](./error-handling.md)
- [CSS Patterns](../styling/css-patterns.md)
- [API Route Structure](../api/route-structure.md)
