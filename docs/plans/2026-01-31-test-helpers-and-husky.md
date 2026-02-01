# Test Helpers and Husky Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add missing test helpers (server action helpers, mockGetUser) and set up Husky pre-commit hooks with lint-staged.

**Architecture:** Create a placeholder `getUser` function in `src/lib/auth/` that returns a mock user (since auth isn't implemented). Add test helpers that mirror the boilerplate patterns. Configure Husky + lint-staged for pre-commit linting and type-checking.

**Tech Stack:** Bun test, Husky, lint-staged, Prettier

---

## Task 1: Add Prettier Configuration

**Files:**
- Create: `.prettierrc`

**Step 1: Create Prettier config**

Create `.prettierrc`:
```json
{
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5"
}
```

**Step 2: Commit**

```bash
git add .prettierrc
git commit -m "chore: add prettier configuration"
```

---

## Task 2: Install Husky and lint-staged

**Files:**
- Modify: `package.json`

**Step 1: Install dependencies**

```bash
yarn add -D husky lint-staged prettier
```

**Step 2: Add prepare script and lint-staged config to package.json**

Add to `package.json` scripts:
```json
"prepare": "husky"
```

Add lint-staged config to `package.json`:
```json
"lint-staged": {
  "*.{css,json}": "prettier --write",
  "*.{ts,tsx}": "sh -c 'tsc -b --noEmit'",
  "**/*.{js,jsx,ts,tsx}": ["prettier --write", "eslint"]
}
```

**Step 3: Initialize Husky**

```bash
yarn prepare
```

**Step 4: Create pre-commit hook**

```bash
echo "yarn lint-staged --continue-on-error" > .husky/pre-commit
```

**Step 5: Commit**

```bash
git add package.json yarn.lock .husky
git commit -m "chore: add husky and lint-staged for pre-commit hooks"
```

---

## Task 3: Create getUser placeholder

**Files:**
- Create: `src/lib/auth/getUser.ts`

**Step 1: Create the getUser function**

Create `src/lib/auth/getUser.ts`:
```typescript
import "server-only";
import type { User } from "@prisma/client";

export type SessionUser = User | null;
export type NonNullableSessionUser = NonNullable<SessionUser>;

/**
 * Get the current authenticated user.
 * TODO: Implement actual auth (NextAuth, Clerk, etc.)
 */
export default async function getUser(): Promise<SessionUser> {
  // TODO: Replace with actual auth implementation
  // For now, return null (not authenticated)
  return null;
}
```

**Step 2: Commit**

```bash
git add src/lib/auth/getUser.ts
git commit -m "feat: add getUser placeholder for auth"
```

---

## Task 4: Create mockGetUser test helper

**Files:**
- Create: `test/helpers/mocks/mockGetUser.ts`

**Step 1: Create the mock helper**

Create `test/helpers/mocks/mockGetUser.ts`:
```typescript
import { spyOn } from "bun:test";
import type { User } from "@prisma/client";
import * as getUserModule from "@/lib/auth/getUser";

type GetUserReturnType = ReturnType<typeof getUserModule.default>;

export function mockGetUser(user: User) {
  return spyOn(getUserModule, "default").mockImplementation(
    (): GetUserReturnType => Promise.resolve(user)
  );
}

export function mockGetUserLoggedOut() {
  return spyOn(getUserModule, "default").mockImplementation(
    (): GetUserReturnType => Promise.resolve(null)
  );
}
```

**Step 2: Commit**

```bash
git add test/helpers/mocks/mockGetUser.ts
git commit -m "feat: add mockGetUser test helper"
```

---

## Task 5: Create server action error types

**Files:**
- Create: `src/lib/serverActions/serverActionError.ts`

**Step 1: Create the server action error types**

Create `src/lib/serverActions/serverActionError.ts`:
```typescript
export type ServerActionFlattenedError = {
  readonly fieldErrors: Record<string, string[]>;
  readonly formErrors: string[];
};

export type ServerActionError = {
  readonly success: false;
  readonly error: ServerActionFlattenedError;
};

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
```

**Step 2: Commit**

```bash
git add src/lib/serverActions/serverActionError.ts
git commit -m "feat: add server action error types"
```

---

## Task 6: Create isServerActionError and isServerActionSuccess

**Files:**
- Create: `src/lib/serverActions/isServerActionError.ts`
- Create: `src/lib/serverActions/isServerActionSuccess.ts`

**Step 1: Create isServerActionError**

Create `src/lib/serverActions/isServerActionError.ts`:
```typescript
import type { ServerActionError } from "./serverActionError";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function isServerActionError<T>(
  result: T | ServerActionError
): result is ServerActionError {
  if (!isRecord(result)) return false;
  if (!("success" in result) || false !== result.success) return false;
  if (!("error" in result) || !isRecord(result.error)) return false;
  if (!("fieldErrors" in result.error) || !isRecord(result.error.fieldErrors))
    return false;
  return "formErrors" in result.error && Array.isArray(result.error.formErrors);
}
```

**Step 2: Create isServerActionSuccess**

Create `src/lib/serverActions/isServerActionSuccess.ts`:
```typescript
import type { ServerActionError } from "./serverActionError";
import { isServerActionError } from "./isServerActionError";

export function isServerActionSuccess<T>(
  result: T | ServerActionError
): result is T {
  return !isServerActionError(result);
}
```

**Step 3: Commit**

```bash
git add src/lib/serverActions/isServerActionError.ts src/lib/serverActions/isServerActionSuccess.ts
git commit -m "feat: add isServerActionError and isServerActionSuccess type guards"
```

---

## Task 7: Create expectServerActionSuccess and expectServerActionError test helpers

**Files:**
- Create: `test/helpers/expectServerActionSuccess.ts`
- Create: `test/helpers/expectServerActionError.ts`

**Step 1: Create expectServerActionSuccess**

Create `test/helpers/expectServerActionSuccess.ts`:
```typescript
import { expect } from "bun:test";
import { isServerActionSuccess } from "@/lib/serverActions/isServerActionSuccess";
import type { ServerActionError } from "@/lib/serverActions/serverActionError";
import { inspect } from "node:util";

export function expectServerActionSuccess<T>(
  result: T
): asserts result is Exclude<T, ServerActionError> {
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expect(
    isServerActionSuccess(result),
    `Expected success but received ${inspect(result, { depth: 10 })}`
  ).toBe(true);
}
```

**Step 2: Create expectServerActionError**

Create `test/helpers/expectServerActionError.ts`:
```typescript
import { expect } from "bun:test";
import { isServerActionError } from "@/lib/serverActions/isServerActionError";
import type { ServerActionError } from "@/lib/serverActions/serverActionError";

export function expectServerActionError<T>(
  result: T
): asserts result is Extract<T, ServerActionError> {
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expect(isServerActionError(result)).toBe(true);
}
```

**Step 3: Commit**

```bash
git add test/helpers/expectServerActionSuccess.ts test/helpers/expectServerActionError.ts
git commit -m "feat: add expectServerActionSuccess and expectServerActionError test helpers"
```

---

## Task 8: Add expectHasProperty and expectDate to expectDefined

**Files:**
- Modify: `test/helpers/expectDefined.ts`

**Step 1: Add missing assertion helpers**

Add to `test/helpers/expectDefined.ts`:
```typescript
export function expectHasProperty<K extends string, T extends object>(
  value: T,
  key: K
): asserts value is T & Record<K, unknown> {
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expect(key in value, `Expected object to have property "${key}"`).toBe(true);
}

export function expectDate(value: unknown): Date {
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expect(value).toBeInstanceOf(Date);
  // eslint-disable-next-line no-restricted-syntax, jest/valid-expect
  expect(
    Number.isNaN((value as Date).getTime()),
    "Expected valid Date"
  ).toBe(false);
  return value as Date;
}
```

**Step 2: Commit**

```bash
git add test/helpers/expectDefined.ts
git commit -m "feat: add expectHasProperty and expectDate to test helpers"
```

---

## Task 9: Add ValidationError field property

**Files:**
- Modify: `src/lib/errors/ValidationError.ts`

**Step 1: Add optional field property**

Update `src/lib/errors/ValidationError.ts`:
```typescript
export class ValidationError extends Error {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/errors/ValidationError.ts
git commit -m "feat: add optional field property to ValidationError"
```

---

## Task 10: Create index exports for serverActions

**Files:**
- Create: `src/lib/serverActions/index.ts`

**Step 1: Create index file**

Create `src/lib/serverActions/index.ts`:
```typescript
export { serverActionError } from "./serverActionError";
export type {
  ServerActionError,
  ServerActionFlattenedError,
} from "./serverActionError";
export { isServerActionError } from "./isServerActionError";
export { isServerActionSuccess } from "./isServerActionSuccess";
```

**Step 2: Commit**

```bash
git add src/lib/serverActions/index.ts
git commit -m "feat: add index exports for serverActions"
```

---

## Task 11: Verify setup works

**Step 1: Run type-check**

```bash
yarn type-check
```

Expected: No errors

**Step 2: Run lint**

```bash
yarn lint
```

Expected: No errors (or only pre-existing ones)

**Step 3: Test pre-commit hook**

Make a small change to any file, stage it, and try to commit:
```bash
echo "" >> .prettierrc
git add .prettierrc
git commit -m "test: verify pre-commit hook works"
```

Expected: lint-staged runs and the commit succeeds

**Step 4: Final commit if needed**

If any files were formatted by prettier during the hook test:
```bash
git add -A
git commit -m "style: apply prettier formatting"
```

---

## Summary

After completing all tasks, you will have:

1. ✅ Prettier configuration
2. ✅ Husky pre-commit hooks with lint-staged
3. ✅ `getUser` placeholder in `src/lib/auth/`
4. ✅ `mockGetUser` test helper
5. ✅ Server action error types and helpers
6. ✅ `expectServerActionSuccess` and `expectServerActionError` test helpers
7. ✅ Enhanced `expectDefined` with `expectHasProperty` and `expectDate`
8. ✅ `ValidationError` with optional field property
