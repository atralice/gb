# Exercise Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement two-pool exercise library (global + per-trainer) with copy-on-select, trainer library page, and admin management page.

**Architecture:** Add `ownerId` and `globalSourceId` to `Exercise`. Trainers own copies; global exercises are admin-curated. ExercisePicker searches both pools, auto-copies global exercises into trainer library on selection. Dedicated pages for browsing own library and admin management.

**Tech Stack:** Next.js 16 App Router, Prisma/PostgreSQL, React 19, server actions, bun test, cmdk

**Design doc:** `docs/plans/2026-03-01-exercise-library-design.md`

---

## Task 1: Schema migration — add ownerId, globalSourceId, update unique constraint

**Files:**
- Modify: `schema.prisma`

**Step 1: Update Exercise model in schema**

Replace the Exercise model in `schema.prisma` with:

```prisma
model Exercise {
  id             String        @id @default(uuid())
  name           String
  exerciseType   ExerciseType  @default(weighted)
  instructions   String?
  videoUrl       String?
  tags           String[]      @default([])

  ownerId        String?
  owner          User?         @relation("OwnedExercises", fields: [ownerId], references: [id])

  globalSourceId String?
  globalSource   Exercise?     @relation("ExerciseCopies", fields: [globalSourceId], references: [id])
  copies         Exercise[]    @relation("ExerciseCopies")

  workoutBlockExercises WorkoutBlockExercise[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([name, ownerId])
}
```

Add the back-relation on User (after the existing relations):

```prisma
  ownedExercises Exercise[] @relation("OwnedExercises")
```

This drops `@unique` on `name` and adds `@@unique([name, ownerId])`.

**Step 2: Run migration**

Run: `bunx prisma migrate dev --name add-exercise-ownership`

Expected: Migration succeeds. All existing exercises get `ownerId = null` and `globalSourceId = null` (they become global).

**Step 3: Generate client**

Run: `bunx prisma generate`

**Step 4: Update exercise factory**

Add `ownerId` and `globalSourceId` to `test/helpers/factories/exerciseFactory.ts`:

In `buildAttributes()`, add:
```typescript
ownerId: null,
globalSourceId: null,
```

**Step 5: Verify**

Run: `bun run tsc --noEmit`
Expected: PASS (no type errors)

Run: `bun test`
Expected: PASS (existing tests still work — all exercises are global)

**Step 6: Commit**

```bash
git add schema.prisma prisma/migrations/ test/helpers/factories/exerciseFactory.ts
git commit -m "feat: add ownerId and globalSourceId to Exercise model"
```

---

## Task 2: Update searchExercises with trainer visibility

**Files:**
- Modify: `src/lib/trainer/searchExercises.ts`
- Modify: `src/lib/trainer/__tests__/searchExercises.test.ts`

**Step 1: Write failing tests**

Add these tests to `src/lib/trainer/__tests__/searchExercises.test.ts`:

```typescript
import userFactory from "test/helpers/factories/userFactory";

// ... inside describe("searchExercises"):

test("returns trainer's own exercises first, then global matches", async () => {
  const trainer = await userFactory.create({ role: "trainer" });
  await exerciseFactory.create({ name: "Squat", owner: { connect: { id: trainer.id } } });
  await exerciseFactory.create({ name: "Squat" }); // global

  const results = await searchExercises("squat", trainer.id);

  expect(results).toHaveLength(2);
  expect(results[0]!.name).toBe("Squat");
  expect(results[0]!.isGlobal).toBe(false);
  expect(results[1]!.name).toBe("Squat");
  expect(results[1]!.isGlobal).toBe(true);
});

test("without trainerId returns only global exercises", async () => {
  const trainer = await userFactory.create({ role: "trainer" });
  await exerciseFactory.create({ name: "Squat", owner: { connect: { id: trainer.id } } });
  await exerciseFactory.create({ name: "Squat" }); // global

  const results = await searchExercises("squat");

  expect(results).toHaveLength(1);
  expect(results[0]!.isGlobal).toBe(true);
});

test("does not return other trainers' exercises", async () => {
  const trainerA = await userFactory.create({ role: "trainer" });
  const trainerB = await userFactory.create({ role: "trainer" });
  await exerciseFactory.create({ name: "Squat", owner: { connect: { id: trainerA.id } } });
  await exerciseFactory.create({ name: "Bench", owner: { connect: { id: trainerB.id } } });

  const results = await searchExercises("", trainerA.id);

  const names = results.map((r) => r.name);
  expect(names).not.toContain("Bench");
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/lib/trainer/__tests__/searchExercises.test.ts`
Expected: FAIL — `searchExercises` doesn't accept `trainerId`, doesn't return `isGlobal`

**Step 3: Implement updated searchExercises**

Replace `src/lib/trainer/searchExercises.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";

export type ExerciseSearchResult = {
  id: string;
  name: string;
  exerciseType: string;
  isGlobal: boolean;
};

export async function searchExercises(
  query: string,
  trainerId?: string
): Promise<ExerciseSearchResult[]> {
  const nameFilter = query
    ? { name: { contains: query, mode: "insensitive" as const } }
    : {};

  // If trainerId given: own exercises + global. Otherwise: global only.
  const ownerFilter = trainerId
    ? { OR: [{ ownerId: trainerId }, { ownerId: null }] }
    : { ownerId: null };

  const exercises = await prisma.exercise.findMany({
    where: { ...nameFilter, ...ownerFilter },
    select: {
      id: true,
      name: true,
      exerciseType: true,
      ownerId: true,
    },
    orderBy: { name: "asc" },
    take: 40,
  });

  // Sort: trainer's own first, then global
  if (trainerId) {
    exercises.sort((a, b) => {
      const aOwn = a.ownerId === trainerId ? 0 : 1;
      const bOwn = b.ownerId === trainerId ? 0 : 1;
      if (aOwn !== bOwn) return aOwn - bOwn;
      return a.name.localeCompare(b.name);
    });
  }

  return exercises.slice(0, 20).map((e) => ({
    id: e.id,
    name: e.name,
    exerciseType: e.exerciseType,
    isGlobal: e.ownerId === null,
  }));
}
```

**Step 4: Update existing tests that call searchExercises without trainerId**

Existing tests create exercises without `ownerId` (global). They call `searchExercises(query)` without trainerId. With the new logic, this returns only global exercises — same behavior. Existing tests should still pass unchanged.

**Step 5: Run tests to verify they pass**

Run: `bun test src/lib/trainer/__tests__/searchExercises.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/lib/trainer/searchExercises.ts src/lib/trainer/__tests__/searchExercises.test.ts
git commit -m "feat: searchExercises supports trainer visibility (own + global)"
```

---

## Task 3: Update createExercise to accept ownerId

**Files:**
- Modify: `src/lib/trainer/actions/createExercise.ts`
- Modify: `src/lib/trainer/__tests__/searchExercises.test.ts` (add createExercise tests)

**Step 1: Write failing tests**

Add to the `describe("createExercise")` block in `searchExercises.test.ts`:

```typescript
test("creates exercise with ownerId", async () => {
  const trainer = await userFactory.create({ role: "trainer" });
  const result = await createExercise("My Exercise", "weighted", trainer.id);

  const found = await prisma.exercise.findUnique({ where: { id: result.id } });
  expect(found?.ownerId).toBe(trainer.id);
});

test("creates global exercise when no ownerId", async () => {
  const result = await createExercise("Global Exercise", "weighted");

  const found = await prisma.exercise.findUnique({ where: { id: result.id } });
  expect(found?.ownerId).toBeNull();
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/lib/trainer/__tests__/searchExercises.test.ts`
Expected: FAIL — `createExercise` doesn't accept third param

**Step 3: Implement**

Update `src/lib/trainer/actions/createExercise.ts`:

```typescript
"use server";

import type { ExerciseType } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function createExercise(
  name: string,
  exerciseType: ExerciseType = "weighted",
  ownerId?: string
): Promise<{ id: string }> {
  const exercise = await prisma.exercise.create({
    data: {
      name,
      exerciseType,
      ...(ownerId ? { owner: { connect: { id: ownerId } } } : {}),
    },
    select: { id: true },
  });

  return exercise;
}
```

**Step 4: Run tests to verify pass**

Run: `bun test src/lib/trainer/__tests__/searchExercises.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/actions/createExercise.ts src/lib/trainer/__tests__/searchExercises.test.ts
git commit -m "feat: createExercise accepts optional ownerId"
```

---

## Task 4: Add copyGlobalExercise server action

**Files:**
- Create: `src/lib/trainer/actions/copyGlobalExercise.ts`
- Create: `src/lib/trainer/__tests__/copyGlobalExercise.test.ts`

**Step 1: Write failing tests**

Create `src/lib/trainer/__tests__/copyGlobalExercise.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import prisma from "@/lib/prisma";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import userFactory from "test/helpers/factories/userFactory";
import truncateDb from "test/helpers/test-helpers";
import { copyGlobalExercise } from "../actions/copyGlobalExercise";

describe("copyGlobalExercise", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("copies global exercise into trainer library", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const global = await exerciseFactory.create({ name: "Squat" });

    const copy = await copyGlobalExercise(global.id, trainer.id);

    const found = await prisma.exercise.findUnique({ where: { id: copy.id } });
    expect(found?.name).toBe("Squat");
    expect(found?.ownerId).toBe(trainer.id);
    expect(found?.globalSourceId).toBe(global.id);
    expect(copy.id).not.toBe(global.id);
  });

  test("returns existing copy if trainer already has exercise with same name", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const global = await exerciseFactory.create({ name: "Squat" });
    const existing = await exerciseFactory.create({
      name: "Squat",
      owner: { connect: { id: trainer.id } },
    });

    const result = await copyGlobalExercise(global.id, trainer.id);

    expect(result.id).toBe(existing.id);
    // No new exercise created
    const count = await prisma.exercise.count({ where: { ownerId: trainer.id } });
    expect(count).toBe(1);
  });

  test("copies exerciseType, instructions, tags from global", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const global = await exerciseFactory.create({
      name: "Plank",
      exerciseType: "timed",
      instructions: "Keep core tight",
      tags: ["core", "isometric"],
    });

    const copy = await copyGlobalExercise(global.id, trainer.id);

    const found = await prisma.exercise.findUnique({ where: { id: copy.id } });
    expect(found?.exerciseType).toBe("timed");
    expect(found?.instructions).toBe("Keep core tight");
    expect(found?.tags).toEqual(["core", "isometric"]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/lib/trainer/__tests__/copyGlobalExercise.test.ts`
Expected: FAIL — module not found

**Step 3: Implement**

Create `src/lib/trainer/actions/copyGlobalExercise.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";

export async function copyGlobalExercise(
  globalExerciseId: string,
  trainerId: string
): Promise<{ id: string }> {
  const global = await prisma.exercise.findUniqueOrThrow({
    where: { id: globalExerciseId },
  });

  // If trainer already has an exercise with this name, return it
  const existing = await prisma.exercise.findUnique({
    where: { name_ownerId: { name: global.name, ownerId: trainerId } },
    select: { id: true },
  });

  if (existing) return existing;

  // Create copy in trainer's library
  const copy = await prisma.exercise.create({
    data: {
      name: global.name,
      exerciseType: global.exerciseType,
      instructions: global.instructions,
      videoUrl: global.videoUrl,
      tags: global.tags,
      owner: { connect: { id: trainerId } },
      globalSource: { connect: { id: globalExerciseId } },
    },
    select: { id: true },
  });

  return copy;
}
```

**Step 4: Run tests to verify pass**

Run: `bun test src/lib/trainer/__tests__/copyGlobalExercise.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/actions/copyGlobalExercise.ts src/lib/trainer/__tests__/copyGlobalExercise.test.ts
git commit -m "feat: add copyGlobalExercise server action"
```

---

## Task 5: Update ExercisePicker with grouped results + auto-copy

**Files:**
- Modify: `src/components/trainer/ExercisePicker.tsx`

**Step 1: Update Props type**

The ExercisePicker needs to know the trainerId and handle global exercises. Update the props:

```typescript
type Exercise = { id: string; name: string; exerciseType: string; isGlobal: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
  searchAction: (query: string, trainerId?: string) => Promise<Exercise[]>;
  createAction: (name: string, exerciseType: ExerciseType, ownerId?: string) => Promise<{ id: string }>;
  copyAction: (globalExerciseId: string, trainerId: string) => Promise<{ id: string }>;
  trainerId: string;
};
```

**Step 2: Update search call**

In `ExercisePickerContent`, pass `trainerId` to search:

```typescript
const data = await searchAction(value, trainerId);
```

**Step 3: Add global badge and group results**

In the results list, split into two groups (own + global) with a separator. Add a "Global" badge on global items:

```tsx
{/* Trainer's exercises */}
{results.filter(e => !e.isGlobal).map((exercise) => (
  <Command.Item
    key={exercise.id}
    value={exercise.name}
    onSelect={() => { onSelect(exercise.id); onClose(); }}
    className="px-4 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100"
  >
    {exercise.name}
  </Command.Item>
))}

{/* Separator + global exercises */}
{results.some(e => e.isGlobal) && results.some(e => !e.isGlobal) && (
  <div className="px-4 py-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1 pt-2">
    Biblioteca global
  </div>
)}

{results.filter(e => e.isGlobal).map((exercise) => (
  <Command.Item
    key={exercise.id}
    value={`global-${exercise.name}`}
    onSelect={() => handleGlobalSelect(exercise.id)}
    className="px-4 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100"
  >
    <span className="flex items-center gap-2">
      {exercise.name}
      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
        Global
      </span>
    </span>
  </Command.Item>
))}
```

**Step 4: Add handleGlobalSelect**

When a global exercise is selected, call `copyAction` to copy it, then pass the copy's ID to `onSelect`:

```typescript
const handleGlobalSelect = (globalExerciseId: string) => {
  startTransition(async () => {
    const copy = await copyAction(globalExerciseId, trainerId);
    onSelect(copy.id);
    onClose();
  });
};
```

**Step 5: Update createAction call to pass trainerId as ownerId**

In `handleCreate`:

```typescript
const created = await createAction(creatingName, exerciseType, trainerId);
```

**Step 6: Verify**

Run: `bun run tsc --noEmit`
Expected: PASS

**Step 7: Update WeekDetailTable to pass new props to ExercisePicker**

In `src/components/trainer/WeekDetailTable.tsx`, where ExercisePicker is rendered, add the `trainerId`, `copyAction`, and update the `searchAction`/`createAction` calls. The `trainerId` should be passed down from the page (it's available as the logged-in user's ID).

Add `trainerId` to the component's props and to `WeekDetailContext`. Pass `copyAction={copyGlobalExercise}` and `trainerId={trainerId}` to ExercisePicker.

**Step 8: Update week page to pass trainerId**

In `src/app/trainer/athletes/[athleteId]/week/[weekNumber]/page.tsx`, pass `trainerId={user.id}` to `WeekDetailTable`.

**Step 9: Verify**

Run: `bun run tsc --noEmit && bun run lint`
Expected: PASS

**Step 10: Commit**

```bash
git add src/components/trainer/ExercisePicker.tsx src/components/trainer/WeekDetailTable.tsx src/app/trainer/athletes/\[athleteId\]/week/\[weekNumber\]/page.tsx
git commit -m "feat: ExercisePicker shows grouped results with global badge and auto-copy"
```

---

## Task 6: Trainer library page — data layer

**Files:**
- Create: `src/lib/trainer/getTrainerExercises.ts`
- Create: `src/lib/trainer/__tests__/getTrainerExercises.test.ts`

**Step 1: Write failing tests**

Create `src/lib/trainer/__tests__/getTrainerExercises.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import userFactory from "test/helpers/factories/userFactory";
import truncateDb from "test/helpers/test-helpers";
import { getTrainerExercises } from "../getTrainerExercises";

describe("getTrainerExercises", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns only exercises owned by the trainer", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const other = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({ name: "Mine", owner: { connect: { id: trainer.id } } });
    await exerciseFactory.create({ name: "Theirs", owner: { connect: { id: other.id } } });
    await exerciseFactory.create({ name: "Global" }); // global

    const results = await getTrainerExercises(trainer.id);

    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("Mine");
  });

  test("filters by search query", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({ name: "Squat", owner: { connect: { id: trainer.id } } });
    await exerciseFactory.create({ name: "Bench Press", owner: { connect: { id: trainer.id } } });

    const results = await getTrainerExercises(trainer.id, { search: "squat" });

    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("Squat");
  });

  test("filters by exercise type", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({ name: "Squat", exerciseType: "weighted", owner: { connect: { id: trainer.id } } });
    await exerciseFactory.create({ name: "Plank", exerciseType: "timed", owner: { connect: { id: trainer.id } } });

    const results = await getTrainerExercises(trainer.id, { type: "timed" });

    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("Plank");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/lib/trainer/__tests__/getTrainerExercises.test.ts`
Expected: FAIL — module not found

**Step 3: Implement**

Create `src/lib/trainer/getTrainerExercises.ts`:

```typescript
import "server-only";
import { cache } from "react";
import type { ExerciseType } from "@prisma/client";
import prisma from "@/lib/prisma";

export type TrainerExercise = {
  id: string;
  name: string;
  exerciseType: ExerciseType;
  instructions: string | null;
  videoUrl: string | null;
  tags: string[];
  globalSourceId: string | null;
};

type Filters = {
  search?: string;
  type?: ExerciseType;
};

export const getTrainerExercises = cache(async function getTrainerExercises(
  trainerId: string,
  filters?: Filters
): Promise<TrainerExercise[]> {
  const where: Record<string, unknown> = { ownerId: trainerId };

  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }
  if (filters?.type) {
    where.exerciseType = filters.type;
  }

  return prisma.exercise.findMany({
    where,
    select: {
      id: true,
      name: true,
      exerciseType: true,
      instructions: true,
      videoUrl: true,
      tags: true,
      globalSourceId: true,
    },
    orderBy: { name: "asc" },
  });
});
```

**Step 4: Run tests to verify pass**

Run: `bun test src/lib/trainer/__tests__/getTrainerExercises.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/getTrainerExercises.ts src/lib/trainer/__tests__/getTrainerExercises.test.ts
git commit -m "feat: add getTrainerExercises query with search and type filters"
```

---

## Task 7: Trainer library page — UI

**Files:**
- Create: `src/app/trainer/exercises/page.tsx`
- Create: `src/components/trainer/ExerciseLibrary.tsx`

**Step 1: Create the server page**

Create `src/app/trainer/exercises/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getTrainerExercises } from "@/lib/trainer/getTrainerExercises";
import ExerciseLibrary from "@/components/trainer/ExerciseLibrary";
import PageShell from "@/components/ui/PageShell";
import type { ExerciseType } from "@prisma/client";

type Props = {
  searchParams: Promise<{ search?: string; type?: string }>;
};

export default async function TrainerExercisesPage({ searchParams }: Props) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/");

  const exercises = await getTrainerExercises(user.id, {
    search: sp.search,
    type: sp.type as ExerciseType | undefined,
  });

  return (
    <PageShell backHref="/trainer/athletes" title="Mis ejercicios">
      <ExerciseLibrary exercises={exercises} />
    </PageShell>
  );
}
```

**Step 2: Create the client component**

Create `src/components/trainer/ExerciseLibrary.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TrainerExercise } from "@/lib/trainer/getTrainerExercises";

const typeLabels: Record<string, string> = {
  weighted: "Peso",
  bodyweight: "Corporal",
  timed: "Tiempo",
};

const typeFilters = [
  { value: "", label: "Todos" },
  { value: "weighted", label: "Peso" },
  { value: "bodyweight", label: "Corporal" },
  { value: "timed", label: "Tiempo" },
];

type Props = {
  exercises: TrainerExercise[];
};

export default function ExerciseLibrary({ exercises }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  const activeType = searchParams.get("type") ?? "";

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/trainer/exercises?${params.toString()}`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search bar */}
      <input
        type="text"
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          updateParams("search", e.target.value);
        }}
        placeholder="Buscar ejercicio..."
        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
      />

      {/* Type filter */}
      <div className="flex gap-2">
        {typeFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => updateParams("type", f.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              activeType === f.value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          No hay ejercicios
        </p>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {exercise.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {typeLabels[exercise.exerciseType] ?? exercise.exerciseType}
                    {exercise.tags.length > 0 && (
                      <span> · {exercise.tags.join(", ")}</span>
                    )}
                  </p>
                </div>
                {exercise.globalSourceId && (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    Copiado
                  </span>
                )}
              </div>
              {exercise.instructions && (
                <p className="text-xs text-slate-500 mt-1">
                  {exercise.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Verify**

Run: `bun run tsc --noEmit && bun run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/trainer/exercises/page.tsx src/components/trainer/ExerciseLibrary.tsx
git commit -m "feat: add trainer exercise library page at /trainer/exercises"
```

---

## Task 8: Admin exercises page — data layer

**Files:**
- Create: `src/lib/admin/getGlobalExercises.ts`
- Create: `src/lib/admin/__tests__/getGlobalExercises.test.ts`

**Step 1: Write failing tests**

Create `src/lib/admin/__tests__/getGlobalExercises.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import userFactory from "test/helpers/factories/userFactory";
import truncateDb from "test/helpers/test-helpers";
import { getGlobalExercises } from "../getGlobalExercises";

describe("getGlobalExercises", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns only global exercises", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({ name: "Global Squat" });
    await exerciseFactory.create({ name: "Trainer Squat", owner: { connect: { id: trainer.id } } });

    const results = await getGlobalExercises();

    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("Global Squat");
  });

  test("filters by search query", async () => {
    await exerciseFactory.create({ name: "Squat" });
    await exerciseFactory.create({ name: "Bench Press" });

    const results = await getGlobalExercises({ search: "squat" });

    expect(results).toHaveLength(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/lib/admin/__tests__/getGlobalExercises.test.ts`
Expected: FAIL — module not found

**Step 3: Implement**

Create `src/lib/admin/getGlobalExercises.ts`:

```typescript
import "server-only";
import { cache } from "react";
import type { ExerciseType } from "@prisma/client";
import prisma from "@/lib/prisma";

export type GlobalExercise = {
  id: string;
  name: string;
  exerciseType: ExerciseType;
  instructions: string | null;
  videoUrl: string | null;
  tags: string[];
};

type Filters = {
  search?: string;
  type?: ExerciseType;
};

export const getGlobalExercises = cache(async function getGlobalExercises(
  filters?: Filters
): Promise<GlobalExercise[]> {
  const where: Record<string, unknown> = { ownerId: null };

  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }
  if (filters?.type) {
    where.exerciseType = filters.type;
  }

  return prisma.exercise.findMany({
    where,
    select: {
      id: true,
      name: true,
      exerciseType: true,
      instructions: true,
      videoUrl: true,
      tags: true,
    },
    orderBy: { name: "asc" },
  });
});
```

**Step 4: Run tests to verify pass**

Run: `bun test src/lib/admin/__tests__/getGlobalExercises.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/admin/getGlobalExercises.ts src/lib/admin/__tests__/getGlobalExercises.test.ts
git commit -m "feat: add getGlobalExercises query for admin page"
```

---

## Task 9: Admin exercises page — CRUD actions

**Files:**
- Create: `src/lib/admin/actions/updateExercise.ts`
- Create: `src/lib/admin/actions/deleteExercise.ts`

**Step 1: Create updateExercise action**

Create `src/lib/admin/actions/updateExercise.ts`:

```typescript
"use server";

import type { ExerciseType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateExercise(
  id: string,
  data: {
    name?: string;
    exerciseType?: ExerciseType;
    instructions?: string | null;
    videoUrl?: string | null;
    tags?: string[];
  }
): Promise<void> {
  await prisma.exercise.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/exercises");
}
```

**Step 2: Create deleteExercise action**

Create `src/lib/admin/actions/deleteExercise.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteExercise(id: string): Promise<void> {
  await prisma.exercise.delete({
    where: { id },
  });

  revalidatePath("/admin/exercises");
}
```

**Step 3: Verify**

Run: `bun run tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/admin/actions/updateExercise.ts src/lib/admin/actions/deleteExercise.ts
git commit -m "feat: add admin updateExercise and deleteExercise actions"
```

---

## Task 10: Admin exercises page — UI

**Files:**
- Create: `src/app/admin/exercises/page.tsx`
- Create: `src/components/admin/AdminExerciseList.tsx`

**Step 1: Create the server page**

Create `src/app/admin/exercises/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getGlobalExercises } from "@/lib/admin/getGlobalExercises";
import AdminExerciseList from "@/components/admin/AdminExerciseList";
import PageShell from "@/components/ui/PageShell";
import type { ExerciseType } from "@prisma/client";

type Props = {
  searchParams: Promise<{ search?: string; type?: string }>;
};

export default async function AdminExercisesPage({ searchParams }: Props) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const exercises = await getGlobalExercises({
    search: sp.search,
    type: sp.type as ExerciseType | undefined,
  });

  return (
    <PageShell title="Ejercicios globales">
      <AdminExerciseList exercises={exercises} />
    </PageShell>
  );
}
```

**Step 2: Create the client component**

Create `src/components/admin/AdminExerciseList.tsx`. This component should include:

- Search input updating `?search` param
- Type filter buttons (same pattern as ExerciseLibrary)
- Exercise list with inline edit capability (name, type, instructions, tags)
- Delete button with confirmation
- "Create new" button at top that opens inline form
- Wire up to `updateExercise`, `deleteExercise`, `createExercise` server actions

The component should follow the same visual patterns as `ExerciseLibrary.tsx` — card list with slate borders, same filter chips. For editing, use an expandable card pattern: clicking an exercise card expands it to show editable fields with Save/Cancel buttons.

This is a larger component (~200 lines). Key structure:

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GlobalExercise } from "@/lib/admin/getGlobalExercises";
import { updateExercise } from "@/lib/admin/actions/updateExercise";
import { deleteExercise } from "@/lib/admin/actions/deleteExercise";
import { createExercise } from "@/lib/trainer/actions/createExercise";
import type { ExerciseType } from "@prisma/client";

// Same typeFilters and typeLabels as ExerciseLibrary

type Props = {
  exercises: GlobalExercise[];
};

export default function AdminExerciseList({ exercises }: Props) {
  // Same search + type filter pattern as ExerciseLibrary
  // Add editingId state for inline editing
  // Add creating state for new exercise form
  // Each card: click to expand/edit, delete with confirm
}
```

**Step 3: Verify**

Run: `bun run tsc --noEmit && bun run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/admin/exercises/page.tsx src/components/admin/AdminExerciseList.tsx
git commit -m "feat: add admin exercises page at /admin/exercises"
```

---

## Task 11: Wire up navigation links

**Files:**
- Check for existing navigation/sidebar components and add links

**Step 1: Add link to trainer exercises page**

Find the trainer navigation (likely in a layout or sidebar) and add a link to `/trainer/exercises` with label "Mis ejercicios".

**Step 2: Add link to admin exercises page**

Add a link to `/admin/exercises` with label "Ejercicios" in admin navigation.

**Step 3: Verify**

Run: `bun run tsc --noEmit && bun run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add navigation links to exercise library pages"
```

---

## Task 12: Final verification

**Step 1: Type check**

Run: `bun run tsc --noEmit`
Expected: PASS

**Step 2: Lint**

Run: `bun run lint`
Expected: PASS

**Step 3: All tests**

Run: `bun test`
Expected: ALL PASS

**Step 4: Manual verification checklist**

1. Create a trainer-owned exercise → appears in `/trainer/exercises`
2. Global exercises don't appear in trainer library
3. ExercisePicker shows trainer exercises first, then global with "Global" badge
4. Selecting a global exercise creates a copy in trainer library
5. Selecting same global exercise again reuses existing copy
6. Admin page at `/admin/exercises` shows only global exercises
7. Admin can create, edit, and delete global exercises
8. Search and type filters work on both pages
