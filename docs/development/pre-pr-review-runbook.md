# Pre-PR Self-Review Runbook for LLM Coding Agents

## Overview

This runbook provides a comprehensive checklist for LLM coding agents to self-review their code changes before opening a pull request. Following this runbook ensures code quality, adherence to project standards, and reduces the likelihood of CI failures or review feedback.

## 🔍 Pre-Commit Quality Checks

### 1. TypeScript Validation

**Run TypeScript compiler checks:**

```bash
yarn tsc --noEmit
```

**Verify TypeScript best practices:**

- ✅ No `any` types used anywhere in the code
- ✅ No `as` type casting (use proper type definitions instead)
- ✅ No `!` non-null assertions (use `@expectDefined` or `@expectDefinedNotNull`)
- ✅ Prefer `type` over `interface` for type definitions
- ✅ Use Prisma-generated types for database models and enums
- ✅ Use proper enum values directly (e.g., `TaskType.enumValue`) instead of string literals

**📚 Reference:** [TypeScript Guidelines](typescript-guidelines.md) for comprehensive type definitions and best practices

### 2. Linting and Code Style

**Run ESLint checks:**

```bash
yarn lint
```

**Verify code style compliance:**

- ✅ Use object parameter style for function arguments instead of positional
- ✅ Follow functional programming patterns where possible
- ✅ Format numbers ≥ 1000 with underscores: `1_000` (for cents: `1_000_00`)
- ✅ Use yoda syntax with equality only
- ✅ For API routes, use helper functions like `success()` from `@/lib/api/jsonResponse.ts`
- ✅ Never silence `noUnusedLocals`/`noUnusedParameters` errors with underscore prefixes

**📚 Reference:** [Code Style Guidelines](code-style.md) for complete coding principles and naming conventions

### 3. Testing Requirements

**Run the test suite:**

```bash
yarn test
```

**Verify testing standards:**

- ✅ Use `bun:test`, NOT Jest or Vitest
- ✅ Import test functions explicitly from "bun:test" (`describe`, `test`, `expect`, `beforeEach`)
- ✅ DO NOT use try/catch in tests
- ✅ Use Bun's `spyOn()` instead of Jest-style mocking
- ✅ Test files named `__tests__/FILENAME.test.ts`
- ✅ Use factory system for creating test data
- ✅ Use `testData` utility for JSON test fixtures
- ✅ Use `toHaveDifference` matcher for database state assertions
- ✅ Follow map, sort, expect pattern for array assertions

**📚 Reference:** [Testing Guide](../testing/test-utilities.md) for comprehensive testing patterns, utilities, and best practices

## 🏗️ Architecture and Patterns Review

### 4. API Implementation Patterns

**For API routes, verify:**

- ✅ Route handlers structured in separate files from route.ts export
- ✅ Validation implemented in separate schema files using Zod
- ✅ Use `findUniqueOrThrow` instead of `findUnique` + null check
- ✅ Put all code inside `handleApiErrors` function
- ✅ Don't use try/catch for JSON parsing (handled by framework)
- ✅ Use proper naming conventions for request variables in tests

**📚 Reference:** [API Route Structure](../api/route-structure.md) for Next.js App Router patterns and file organization

### 5. Database and Prisma Patterns

**Verify database interactions:**

- ✅ Use Prisma-generated types for all database operations
- ✅ Use `@expectDefined` and `@expectDefinedNotNull` for type narrowing
- ✅ Follow proper transaction patterns when needed
- ✅ Use factory functions in tests, don't mock Prisma
- ✅ Use `factory.reload()` method to check updated model values

## 🎨 UI and Component Standards

### 6. React Component Patterns

**Verify React best practices:**

- ✅ Prefer plain functions over `React.FC`
- ✅ Use `cn()` utility for className props with conditional styling
- ✅ Apply `data-1p-ignore` to form elements
- ✅ Use dynamic loading for components that depend on localStorage
- ✅ Follow existing component patterns and naming conventions

**📚 Reference:** [CSS Patterns](../styling/css-patterns.md) for cn() utility usage and styling best practices

## 🔒 Security and Error Handling

### 7. Error Handling Patterns

**Verify error handling:**

- ✅ Use `catchErrors` utility instead of try/catch blocks
- ✅ Catch specific error types like `ValidationError`
- ✅ Integrate with Sentry for error logging
- ✅ Handle expected errors gracefully
- ✅ Never expose secrets or keys in logs

**📚 Reference:** [Error Handling](error-handling.md) for catchErrors utility and ValidationError patterns

### 8. Security Best Practices

**Security checklist:**

- ✅ Never commit secrets or keys to repository
- ✅ Use environment variables for sensitive configuration
- ✅ Follow authentication patterns with Stytch
- ✅ Validate all user inputs with Zod schemas
- ✅ Use proper authorization checks for protected routes

## 📋 Pre-Commit Verification Commands

**Run these commands before committing:**

```bash
# TypeScript check
yarn tsc --noEmit

# Linting
yarn lint

# Tests
yarn test

# Build verification
yarn build
```

## 🚀 Pre-PR Submission Checklist

**Before opening the PR:**

- ✅ All TypeScript errors resolved
- ✅ All linting issues fixed
- ✅ All tests passing
- ✅ Build succeeds without errors
- ✅ Pre-commit hooks pass
- ✅ Code follows project conventions from CLAUDE.md
- ✅ New dependencies approved (if any)
- ✅ Database migrations created (if schema changes)
- ✅ Documentation updated (if public API changes)

**Git workflow verification:**

- ✅ Changes committed to correct branch
- ✅ Commit messages are descriptive
- ✅ Only relevant files staged (no `git add .`)
- ✅ Branch pushed to origin before creating PR

## 🔄 Post-PR Creation

**After creating the PR:**

- ✅ Monitor CI status and wait for all checks to complete
- ✅ Address any CI failures immediately
- ✅ Respond to review comments promptly
- ✅ Update PR branch with additional commits (don't create new PRs)
- ✅ Ensure PR description includes testing information

## 📚 Related Documentation

For comprehensive guidance on each area covered in this runbook:

- **[Project Setup](../setup/README.md)** - Project overview, common commands, and database setup
- **[TypeScript Guidelines](typescript-guidelines.md)** - Type definitions, best practices, and type narrowing
- **[Error Handling](error-handling.md)** - catchErrors utility and ValidationError patterns
- **[Code Style](code-style.md)** - General principles, React patterns, and naming conventions
- **[CSS Patterns](../styling/css-patterns.md)** - cn() utility usage and styling best practices
- **[API Route Structure](../api/route-structure.md)** - Next.js App Router patterns and file organization
- **[Forms Guide](../forms/multi-step-forms.md)** - Multi-step forms, state management, and adding new steps
- **[Inngest Patterns](../jobs/inngest-patterns.md)** - Async job patterns and registration requirements
- **[Task Management](../tasks/task-management.md)** - Creating, managing, and completing tasks in the workflow engine
- **[Testing Guide](../testing/test-utilities.md)** - Complete testing guide with utilities, patterns, and best practices

## ⚠️ Common Pitfalls to Avoid

- **Never** use `any` types or type assertions
- **Never** mock internal functions in tests
- **Never** use Jest patterns with bun:test
- **Never** forget to register Inngest jobs in both required locations
- **Never** commit secrets or use `git add .`
- **Never** create new PRs when updating existing ones
- **Never** ignore TypeScript errors or linting warnings
- **Never** skip running tests before committing

Following this runbook ensures your code meets the high standards expected in the Deferred codebase and reduces the time needed for code review cycles.
