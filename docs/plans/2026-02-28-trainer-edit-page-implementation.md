# Trainer Edit Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the trainer week editing page with dedicated routing, full exercise CRUD, stepper inputs, editable notes, and bug fixes.

**Architecture:** Split the current `?week=N` conditional page into a dedicated `/week/[weekNumber]` route. Build reusable UI components (SetInput, InlineNote, ExercisePicker, ExerciseMenu) and server actions for all CRUD operations. TDD for all server actions; UI components tested via dev server.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7, TypeScript, Tailwind CSS 4, cmdk (command palette), Bun test runner.

**Design doc:** `docs/plans/2026-02-28-trainer-edit-page-redesign.md`

---

### Task 1: Extend updateSets to support durationSeconds

**Files:**
- Modify: `src/lib/trainer/actions/updateSets.ts`
- Test: `src/lib/trainer/__tests__/updateSets.test.ts`

**Step 1: Write the failing test**

Add to `src/lib/trainer/__tests__/updateSets.test.ts`:

```typescript
it("updates durationSeconds", async () => {
  const set = await setFactory.create({
    workoutBlockExerciseId: exercise.id,
    setIndex: 1,
    reps: null,
    weightKg: null,
    durationSeconds: 40,
  });

  await updateSets([{ setId: set.id, durationSeconds: 50 }]);

  const updated = await setFactory.reload(set);
  expect(updated.durationSeconds).toBe(50);
  expect(updated.reps).toBeNull();
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/updateSets.test.ts`
Expected: FAIL — `durationSeconds` is not in SetUpdate type.

**Step 3: Update updateSets action**

In `src/lib/trainer/actions/updateSets.ts`, add `durationSeconds` to the type and spread:

```typescript
type SetUpdate = {
  setId: string;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
};

export async function updateSets(updates: SetUpdate[]): Promise<void> {
  await prisma.$transaction(
    updates.map((update) =>
      prisma.set.update({
        where: { id: update.setId },
        data: {
          ...(update.reps !== undefined && { reps: update.reps }),
          ...(update.weightKg !== undefined && { weightKg: update.weightKg }),
          ...(update.durationSeconds !== undefined && {
            durationSeconds: update.durationSeconds,
          }),
        },
      })
    )
  );

  revalidatePath("/trainer/athletes");
}
```

Also update `handleSave` filter in `WeekDetailTable.tsx` (line ~101) to include `durationSeconds`:

```typescript
const updates = Array.from(editedSets.values()).filter(
  (u) => u.reps !== undefined || u.weightKg !== undefined || u.durationSeconds !== undefined
);
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/updateSets.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/actions/updateSets.ts src/lib/trainer/__tests__/updateSets.test.ts
git commit -m "feat: add durationSeconds support to updateSets action"
```

---

### Task 2: Note update server actions

**Files:**
- Create: `src/lib/trainer/actions/updateDayNotes.ts`
- Create: `src/lib/trainer/actions/updateBlockComment.ts`
- Create: `src/lib/trainer/actions/updateExerciseComment.ts`
- Test: `src/lib/trainer/__tests__/updateNotes.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/trainer/__tests__/updateNotes.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { truncateDb } from "../../../../test/helpers/test-helpers";
import { userFactory } from "../../../../test/helpers/factories/userFactory";
import { workoutDayFactory } from "../../../../test/helpers/factories/workoutDayFactory";
import { workoutBlockFactory } from "../../../../test/helpers/factories/workoutBlockFactory";
import { workoutBlockExerciseFactory } from "../../../../test/helpers/factories/workoutBlockExerciseFactory";
import { exerciseFactory } from "../../../../test/helpers/factories/exerciseFactory";
import { updateDayNotes } from "../actions/updateDayNotes";
import { updateBlockComment } from "../actions/updateBlockComment";
import { updateExerciseComment } from "../actions/updateExerciseComment";

let trainer: Awaited<ReturnType<typeof userFactory.create>>;
let athlete: Awaited<ReturnType<typeof userFactory.create>>;
let day: Awaited<ReturnType<typeof workoutDayFactory.create>>;
let block: Awaited<ReturnType<typeof workoutBlockFactory.create>>;
let exercise: Awaited<ReturnType<typeof exerciseFactory.create>>;
let blockExercise: Awaited<ReturnType<typeof workoutBlockExerciseFactory.create>>;

beforeEach(async () => {
  await truncateDb();
  trainer = await userFactory.create({ role: "trainer" });
  athlete = await userFactory.create({ role: "athlete" });
  exercise = await exerciseFactory.create();
  day = await workoutDayFactory.create({
    trainerId: trainer.id,
    athleteId: athlete.id,
  });
  block = await workoutBlockFactory.create({ workoutDayId: day.id });
  blockExercise = await workoutBlockExerciseFactory.create({
    workoutBlockId: block.id,
    exerciseId: exercise.id,
  });
});

describe("updateDayNotes", () => {
  it("updates day notes", async () => {
    await updateDayNotes(day.id, "Warm up well today");
    const updated = await workoutDayFactory.reload(day);
    expect(updated.notes).toBe("Warm up well today");
  });

  it("clears day notes with empty string", async () => {
    await updateDayNotes(day.id, "Some note");
    await updateDayNotes(day.id, "");
    const updated = await workoutDayFactory.reload(day);
    expect(updated.notes).toBe("");
  });
});

describe("updateBlockComment", () => {
  it("updates block comment", async () => {
    await updateBlockComment(block.id, "90s rest between sets");
    const updated = await workoutBlockFactory.reload(block);
    expect(updated.comment).toBe("90s rest between sets");
  });
});

describe("updateExerciseComment", () => {
  it("updates exercise comment", async () => {
    await updateExerciseComment(blockExercise.id, "Reps por lado");
    const updated = await workoutBlockExerciseFactory.reload(blockExercise);
    expect(updated.comment).toBe("Reps por lado");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/updateNotes.test.ts`
Expected: FAIL — modules don't exist yet.

**Step 3: Implement the three actions**

Create `src/lib/trainer/actions/updateDayNotes.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateDayNotes(
  dayId: string,
  notes: string
): Promise<void> {
  await prisma.workoutDay.update({
    where: { id: dayId },
    data: { notes: notes || null },
  });

  revalidatePath("/trainer/athletes");
}
```

Create `src/lib/trainer/actions/updateBlockComment.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateBlockComment(
  blockId: string,
  comment: string
): Promise<void> {
  await prisma.workoutBlock.update({
    where: { id: blockId },
    data: { comment: comment || null },
  });

  revalidatePath("/trainer/athletes");
}
```

Create `src/lib/trainer/actions/updateExerciseComment.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateExerciseComment(
  blockExerciseId: string,
  comment: string
): Promise<void> {
  await prisma.workoutBlockExercise.update({
    where: { id: blockExerciseId },
    data: { comment: comment || null },
  });

  revalidatePath("/trainer/athletes");
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/updateNotes.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/actions/updateDayNotes.ts src/lib/trainer/actions/updateBlockComment.ts src/lib/trainer/actions/updateExerciseComment.ts src/lib/trainer/__tests__/updateNotes.test.ts
git commit -m "feat: add note update server actions for day, block, and exercise"
```

---

### Task 3: Exercise CRUD server actions

**Files:**
- Create: `src/lib/trainer/actions/addExerciseToBlock.ts`
- Create: `src/lib/trainer/actions/removeExerciseFromBlock.ts`
- Create: `src/lib/trainer/actions/replaceExercise.ts`
- Create: `src/lib/trainer/actions/reorderExercise.ts`
- Create: `src/lib/trainer/searchExercises.ts`
- Test: `src/lib/trainer/__tests__/exerciseCrud.test.ts`
- Test: `src/lib/trainer/__tests__/searchExercises.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/trainer/__tests__/exerciseCrud.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { truncateDb } from "../../../../test/helpers/test-helpers";
import { userFactory } from "../../../../test/helpers/factories/userFactory";
import { workoutDayFactory } from "../../../../test/helpers/factories/workoutDayFactory";
import { workoutBlockFactory } from "../../../../test/helpers/factories/workoutBlockFactory";
import { workoutBlockExerciseFactory } from "../../../../test/helpers/factories/workoutBlockExerciseFactory";
import { exerciseFactory } from "../../../../test/helpers/factories/exerciseFactory";
import { setFactory } from "../../../../test/helpers/factories/setFactory";
import prisma from "@/lib/prisma";
import { addExerciseToBlock } from "../actions/addExerciseToBlock";
import { removeExerciseFromBlock } from "../actions/removeExerciseFromBlock";
import { replaceExercise } from "../actions/replaceExercise";
import { reorderExercise } from "../actions/reorderExercise";

let trainer: Awaited<ReturnType<typeof userFactory.create>>;
let athlete: Awaited<ReturnType<typeof userFactory.create>>;
let day: Awaited<ReturnType<typeof workoutDayFactory.create>>;
let block: Awaited<ReturnType<typeof workoutBlockFactory.create>>;
let exercise1: Awaited<ReturnType<typeof exerciseFactory.create>>;
let exercise2: Awaited<ReturnType<typeof exerciseFactory.create>>;

beforeEach(async () => {
  await truncateDb();
  trainer = await userFactory.create({ role: "trainer" });
  athlete = await userFactory.create({ role: "athlete" });
  exercise1 = await exerciseFactory.create({ name: "Sentadilla" });
  exercise2 = await exerciseFactory.create({ name: "Press banca" });
  day = await workoutDayFactory.create({
    trainerId: trainer.id,
    athleteId: athlete.id,
  });
  block = await workoutBlockFactory.create({ workoutDayId: day.id });
});

describe("addExerciseToBlock", () => {
  it("adds exercise with empty sets matching block series count", async () => {
    // Create existing exercise with 3 sets to establish block series count
    const existing = await workoutBlockExerciseFactory.create({
      workoutBlockId: block.id,
      exerciseId: exercise1.id,
      order: 1,
    });
    await setFactory.create({ workoutBlockExerciseId: existing.id, setIndex: 1 });
    await setFactory.create({ workoutBlockExerciseId: existing.id, setIndex: 2 });
    await setFactory.create({ workoutBlockExerciseId: existing.id, setIndex: 3 });

    await addExerciseToBlock(block.id, exercise2.id);

    const exercises = await prisma.workoutBlockExercise.findMany({
      where: { workoutBlockId: block.id },
      include: { sets: true },
      orderBy: { order: "asc" },
    });

    expect(exercises).toHaveLength(2);
    expect(exercises[1]!.exerciseId).toBe(exercise2.id);
    expect(exercises[1]!.order).toBe(2);
    expect(exercises[1]!.sets).toHaveLength(3);
  });

  it("adds exercise to empty block with 1 set", async () => {
    await addExerciseToBlock(block.id, exercise1.id);

    const exercises = await prisma.workoutBlockExercise.findMany({
      where: { workoutBlockId: block.id },
      include: { sets: true },
    });

    expect(exercises).toHaveLength(1);
    expect(exercises[0]!.order).toBe(1);
    expect(exercises[0]!.sets).toHaveLength(1);
  });
});

describe("removeExerciseFromBlock", () => {
  it("removes exercise and its sets", async () => {
    const blockEx = await workoutBlockExerciseFactory.create({
      workoutBlockId: block.id,
      exerciseId: exercise1.id,
      order: 1,
    });
    await setFactory.create({ workoutBlockExerciseId: blockEx.id, setIndex: 1 });

    await removeExerciseFromBlock(blockEx.id);

    const remaining = await prisma.workoutBlockExercise.findMany({
      where: { workoutBlockId: block.id },
    });
    expect(remaining).toHaveLength(0);

    const sets = await prisma.set.findMany({
      where: { workoutBlockExerciseId: blockEx.id },
    });
    expect(sets).toHaveLength(0);
  });
});

describe("replaceExercise", () => {
  it("swaps exerciseId keeping sets intact", async () => {
    const blockEx = await workoutBlockExerciseFactory.create({
      workoutBlockId: block.id,
      exerciseId: exercise1.id,
      order: 1,
    });
    await setFactory.create({ workoutBlockExerciseId: blockEx.id, setIndex: 1, reps: 8, weightKg: 60 });

    await replaceExercise(blockEx.id, exercise2.id);

    const updated = await workoutBlockExerciseFactory.reload(blockEx);
    expect(updated.exerciseId).toBe(exercise2.id);

    const sets = await prisma.set.findMany({
      where: { workoutBlockExerciseId: blockEx.id },
    });
    expect(sets).toHaveLength(1);
    expect(sets[0]!.reps).toBe(8);
    expect(sets[0]!.weightKg).toBe(60);
  });
});

describe("reorderExercise", () => {
  it("swaps order between two exercises", async () => {
    const ex1 = await workoutBlockExerciseFactory.create({
      workoutBlockId: block.id,
      exerciseId: exercise1.id,
      order: 1,
    });
    const ex2 = await workoutBlockExerciseFactory.create({
      workoutBlockId: block.id,
      exerciseId: exercise2.id,
      order: 2,
    });

    await reorderExercise(ex1.id, ex2.id);

    const updated1 = await workoutBlockExerciseFactory.reload(ex1);
    const updated2 = await workoutBlockExerciseFactory.reload(ex2);
    expect(updated1.order).toBe(2);
    expect(updated2.order).toBe(1);
  });
});
```

Create `src/lib/trainer/__tests__/searchExercises.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { truncateDb } from "../../../../test/helpers/test-helpers";
import { exerciseFactory } from "../../../../test/helpers/factories/exerciseFactory";
import { searchExercises } from "../searchExercises";

beforeEach(async () => {
  await truncateDb();
});

describe("searchExercises", () => {
  it("returns exercises matching query (case-insensitive)", async () => {
    await exerciseFactory.create({ name: "Sentadilla búlgara" });
    await exerciseFactory.create({ name: "Press banca" });
    await exerciseFactory.create({ name: "Sentadilla goblet" });

    const results = await searchExercises("sentadilla");
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.name)).toContain("Sentadilla búlgara");
    expect(results.map((r) => r.name)).toContain("Sentadilla goblet");
  });

  it("returns empty array when no match", async () => {
    await exerciseFactory.create({ name: "Sentadilla" });
    const results = await searchExercises("curl");
    expect(results).toHaveLength(0);
  });

  it("returns all exercises when query is empty", async () => {
    await exerciseFactory.create({ name: "A" });
    await exerciseFactory.create({ name: "B" });
    const results = await searchExercises("");
    expect(results).toHaveLength(2);
  });

  it("limits results to 20", async () => {
    for (let i = 0; i < 25; i++) {
      await exerciseFactory.create({ name: `Exercise ${i}` });
    }
    const results = await searchExercises("");
    expect(results).toHaveLength(20);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/lib/trainer/__tests__/exerciseCrud.test.ts src/lib/trainer/__tests__/searchExercises.test.ts`
Expected: FAIL — modules don't exist.

**Step 3: Implement the actions and query**

Create `src/lib/trainer/searchExercises.ts`:

```typescript
import prisma from "../prisma";

export async function searchExercises(
  query: string
): Promise<{ id: string; name: string }[]> {
  return prisma.exercise.findMany({
    where: query
      ? { name: { contains: query, mode: "insensitive" } }
      : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 20,
  });
}
```

Create `src/lib/trainer/actions/addExerciseToBlock.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addExerciseToBlock(
  blockId: string,
  exerciseId: string
): Promise<void> {
  const existing = await prisma.workoutBlockExercise.findMany({
    where: { workoutBlockId: blockId },
    include: { sets: true },
    orderBy: { order: "asc" },
  });

  const nextOrder = existing.length > 0
    ? Math.max(...existing.map((e) => e.order)) + 1
    : 1;

  // Match series count from existing exercises, default to 1
  const seriesCount = existing.length > 0
    ? Math.max(...existing.map((e) => e.sets.length), 1)
    : 1;

  const newExercise = await prisma.workoutBlockExercise.create({
    data: {
      workoutBlockId: blockId,
      exerciseId,
      order: nextOrder,
    },
  });

  // Create empty sets
  await prisma.$transaction(
    Array.from({ length: seriesCount }, (_, i) =>
      prisma.set.create({
        data: {
          workoutBlockExerciseId: newExercise.id,
          setIndex: i + 1,
          reps: null,
          weightKg: null,
          repsPerSide: false,
        },
      })
    )
  );

  revalidatePath("/trainer/athletes");
}
```

Create `src/lib/trainer/actions/removeExerciseFromBlock.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function removeExerciseFromBlock(
  blockExerciseId: string
): Promise<void> {
  // Cascade delete handles sets via schema onDelete: Cascade
  await prisma.workoutBlockExercise.delete({
    where: { id: blockExerciseId },
  });

  revalidatePath("/trainer/athletes");
}
```

Create `src/lib/trainer/actions/replaceExercise.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function replaceExercise(
  blockExerciseId: string,
  newExerciseId: string
): Promise<void> {
  await prisma.workoutBlockExercise.update({
    where: { id: blockExerciseId },
    data: { exerciseId: newExerciseId },
  });

  revalidatePath("/trainer/athletes");
}
```

Create `src/lib/trainer/actions/reorderExercise.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function reorderExercise(
  exerciseAId: string,
  exerciseBId: string
): Promise<void> {
  const [a, b] = await Promise.all([
    prisma.workoutBlockExercise.findUniqueOrThrow({
      where: { id: exerciseAId },
      select: { order: true },
    }),
    prisma.workoutBlockExercise.findUniqueOrThrow({
      where: { id: exerciseBId },
      select: { order: true },
    }),
  ]);

  await prisma.$transaction([
    prisma.workoutBlockExercise.update({
      where: { id: exerciseAId },
      data: { order: b.order },
    }),
    prisma.workoutBlockExercise.update({
      where: { id: exerciseBId },
      data: { order: a.order },
    }),
  ]);

  revalidatePath("/trainer/athletes");
}
```

**Step 4: Run tests to verify they pass**

Run: `bun test src/lib/trainer/__tests__/exerciseCrud.test.ts src/lib/trainer/__tests__/searchExercises.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/actions/addExerciseToBlock.ts src/lib/trainer/actions/removeExerciseFromBlock.ts src/lib/trainer/actions/replaceExercise.ts src/lib/trainer/actions/reorderExercise.ts src/lib/trainer/searchExercises.ts src/lib/trainer/__tests__/exerciseCrud.test.ts src/lib/trainer/__tests__/searchExercises.test.ts
git commit -m "feat: add exercise CRUD server actions and search query"
```

---

### Task 4: SetInput component

**Files:**
- Create: `src/components/trainer/SetInput.tsx`

**Step 1: Create the component**

Create `src/components/trainer/SetInput.tsx`:

```tsx
"use client";

type Props = {
  value: number | null;
  unit: "kg" | "reps" | "s";
  step: number;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
};

const unitConfig = {
  kg: { label: "kg", inputMode: "decimal" as const },
  reps: { label: "reps", inputMode: "numeric" as const },
  s: { label: "s", inputMode: "numeric" as const },
};

export default function SetInput({ value, unit, step, min, max, onChange }: Props) {
  const config = unitConfig[unit];
  const displayValue = value !== null ? String(value) : "";

  const handleStep = (direction: 1 | -1) => {
    const current = value ?? 0;
    const next = Math.min(max, Math.max(min, current + step * direction));
    onChange(next);
  };

  const handleChange = (raw: string) => {
    if (raw === "") {
      onChange(null);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <div className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          handleStep(-1);
        }}
        className="w-6 h-6 rounded border border-slate-200 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center"
      >
        &minus;
      </button>
      <div className="relative">
        <input
          type="text"
          inputMode={config.inputMode}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="—"
          className="w-14 px-1 py-1 text-xs text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400 tabular-nums"
        />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none">
          {config.label}
        </span>
      </div>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          handleStep(1);
        }}
        className="w-6 h-6 rounded border border-slate-200 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center"
      >
        +
      </button>
    </div>
  );
}
```

**Step 2: Verify it renders**

Run: `npx next dev` and visually check the component renders correctly by temporarily importing it in a page.

**Step 3: Commit**

```bash
git add src/components/trainer/SetInput.tsx
git commit -m "feat: add SetInput component with stepper buttons and unit labels"
```

---

### Task 5: InlineNote component

**Files:**
- Create: `src/components/trainer/InlineNote.tsx`

**Step 1: Create the component**

Create `src/components/trainer/InlineNote.tsx`:

```tsx
"use client";

import { useState, useRef, useTransition } from "react";

type Props = {
  value: string | null;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
};

export default function InlineNote({ value, onSave, placeholder = "+ nota" }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setDraft(value ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    setEditing(false);
    if (draft !== (value ?? "")) {
      startTransition(async () => {
        await onSave(draft);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditing(false);
      setDraft(value ?? "");
    }
  };

  if (!editing) {
    return (
      <button
        onClick={handleOpen}
        className={`text-xs transition-colors ${
          value
            ? "text-slate-500 hover:text-slate-700"
            : "text-slate-300 hover:text-slate-500"
        }`}
      >
        {value || placeholder}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      disabled={isPending}
      className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
    />
  );
}
```

**Step 2: Commit**

```bash
git add src/components/trainer/InlineNote.tsx
git commit -m "feat: add InlineNote click-to-edit component"
```

---

### Task 6: ExercisePicker component

**Files:**
- Create: `src/components/trainer/ExercisePicker.tsx`

**Step 1: Create the component**

This uses the existing `cmdk` dependency for the command palette search.

Create `src/components/trainer/ExercisePicker.tsx`:

```tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { Command } from "cmdk";

type Exercise = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
  searchAction: (query: string) => Promise<Exercise[]>;
  createAction: (name: string) => Promise<{ id: string }>;
};

export default function ExercisePicker({
  open,
  onClose,
  onSelect,
  searchAction,
  createAction,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }

    startTransition(async () => {
      const data = await searchAction(query);
      setResults(data);
    });
  }, [query, open, searchAction]);

  const handleCreate = () => {
    if (!query.trim()) return;
    startTransition(async () => {
      const created = await createAction(query.trim());
      onSelect(created.id);
      onClose();
    });
  };

  if (!open) return null;

  const hasExactMatch = results.some(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4">
        <Command
          className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
          shouldFilter={false}
        >
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar ejercicio..."
            className="w-full px-4 py-3 text-sm border-b border-slate-200 focus:outline-none"
          />
          <Command.List className="max-h-64 overflow-y-auto p-1">
            {isPending && (
              <Command.Loading className="px-4 py-2 text-xs text-slate-400">
                Buscando...
              </Command.Loading>
            )}
            {!isPending && results.length === 0 && query && (
              <Command.Empty className="px-4 py-2 text-xs text-slate-400">
                Sin resultados
              </Command.Empty>
            )}
            {results.map((exercise) => (
              <Command.Item
                key={exercise.id}
                value={exercise.name}
                onSelect={() => {
                  onSelect(exercise.id);
                  onClose();
                }}
                className="px-4 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100"
              >
                {exercise.name}
              </Command.Item>
            ))}
            {query.trim() && !hasExactMatch && (
              <Command.Item
                value={`create-${query}`}
                onSelect={handleCreate}
                className="px-4 py-2 text-sm text-slate-500 rounded-lg cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100 border-t border-slate-100 mt-1"
              >
                Crear &ldquo;{query.trim()}&rdquo;
              </Command.Item>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/trainer/ExercisePicker.tsx
git commit -m "feat: add ExercisePicker combobox with search and inline create"
```

---

### Task 7: ExerciseMenu component

**Files:**
- Create: `src/components/trainer/ExerciseMenu.tsx`

**Step 1: Create the component**

Create `src/components/trainer/ExerciseMenu.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  onReplace: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export default function ExerciseMenu({
  onReplace,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setConfirmRemove(false);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-6 h-6 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors"
      >
        &middot;&middot;&middot;
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1">
          {onMoveUp && (
            <button
              onClick={() => { onMoveUp(); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Mover arriba
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={() => { onMoveDown(); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Mover abajo
            </button>
          )}
          <button
            onClick={() => { onReplace(); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Reemplazar ejercicio
          </button>
          {!confirmRemove ? (
            <button
              onClick={() => setConfirmRemove(true)}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Eliminar
            </button>
          ) : (
            <button
              onClick={() => { onRemove(); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 bg-red-50 font-medium"
            >
              Confirmar eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/trainer/ExerciseMenu.tsx
git commit -m "feat: add ExerciseMenu dropdown with replace, remove, and reorder"
```

---

### Task 8: Create exercise server action (for inline create in picker)

**Files:**
- Create: `src/lib/trainer/actions/createExercise.ts`
- Add test to: `src/lib/trainer/__tests__/searchExercises.test.ts`

**Step 1: Write the failing test**

Add to `src/lib/trainer/__tests__/searchExercises.test.ts`:

```typescript
import { createExercise } from "../actions/createExercise";

describe("createExercise", () => {
  it("creates exercise and returns id", async () => {
    const result = await createExercise("Nuevo ejercicio");
    expect(result.id).toBeDefined();

    const found = await prisma.exercise.findUnique({
      where: { id: result.id },
    });
    expect(found?.name).toBe("Nuevo ejercicio");
  });
});
```

Add `import prisma from "@/lib/prisma";` to the test file imports.

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/searchExercises.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement createExercise**

Create `src/lib/trainer/actions/createExercise.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";

export async function createExercise(
  name: string
): Promise<{ id: string }> {
  const exercise = await prisma.exercise.create({
    data: { name },
    select: { id: true },
  });

  return exercise;
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/searchExercises.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/actions/createExercise.ts src/lib/trainer/__tests__/searchExercises.test.ts
git commit -m "feat: add createExercise server action for inline exercise creation"
```

---

### Task 9: Route change — create dedicated week edit page

**Files:**
- Create: `src/app/trainer/athletes/[athleteId]/week/[weekNumber]/page.tsx`
- Modify: `src/app/trainer/athletes/[athleteId]/page.tsx`
- Modify: `src/components/trainer/WeekOverviewTable.tsx`
- Modify: `src/components/trainer/CreateWeekDialog.tsx`

**Step 1: Create the new week edit page**

Create `src/app/trainer/athletes/[athleteId]/week/[weekNumber]/page.tsx`:

```tsx
import { redirect, notFound } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import WeekDetailTable from "@/components/trainer/WeekDetailTable";
import PageShell from "@/components/ui/PageShell";
import WeekNav from "@/components/ui/WeekNav";
import { format } from "date-fns";

type Props = {
  params: Promise<{ athleteId: string; weekNumber: string }>;
};

export default async function WeekEditPage({ params }: Props) {
  const [user, { athleteId, weekNumber: weekStr }] = await Promise.all([
    getUser(),
    params,
  ]);
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/");

  const weekNumber = parseInt(weekStr, 10);
  if (isNaN(weekNumber)) notFound();

  const weekData = await getAthleteWeek(athleteId, weekNumber);
  if (!weekData) notFound();

  return (
    <PageShell
      backHref={`/trainer/athletes/${athleteId}`}
      title={
        <>
          {weekData.athlete.name} — Semana {weekNumber}
          <span className="text-sm font-normal text-slate-500 ml-2">
            ({format(weekData.weekStartDate, "dd/MM")})
          </span>
        </>
      }
      actions={
        <WeekNav
          weekNumber={weekNumber}
          previousExists={weekData.previousWeekExists}
          nextExists={weekData.nextWeekExists}
          buildHref={(w) =>
            `/trainer/athletes/${athleteId}/week/${w}`
          }
        />
      }
    >
      <div className="p-4">
        <WeekDetailTable data={weekData} />
      </div>
    </PageShell>
  );
}
```

**Step 2: Simplify the overview page**

Update `src/app/trainer/athletes/[athleteId]/page.tsx` — remove the entire `if (week) { ... }` branch, the `searchParams` prop, and unused imports (`getAthleteWeek`, `WeekDetailTable`, `WeekNav`, `format`):

```tsx
import { redirect, notFound } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getAthleteOverview } from "@/lib/trainer/getAthleteOverview";
import WeekOverviewTable from "@/components/trainer/WeekOverviewTable";
import CreateWeekDialogTrigger from "@/components/trainer/CreateWeekDialogTrigger";
import PageShell from "@/components/ui/PageShell";

type AthletePageProps = {
  params: Promise<{ athleteId: string }>;
};

export default async function AthleteOverviewPage({
  params,
}: AthletePageProps) {
  const [user, { athleteId }] = await Promise.all([getUser(), params]);
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/");

  const overview = await getAthleteOverview(athleteId);

  if (!overview) {
    return (
      <PageShell backHref="/trainer/athletes" title="Sin entrenamientos">
        <div className="p-4 text-center text-slate-500">
          Este atleta no tiene entrenamientos programados.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      backHref="/trainer/athletes"
      title={overview.athlete.name}
      actions={
        <CreateWeekDialogTrigger
          athleteId={athleteId}
          trainerId={user.id}
          sourceWeek={overview.latestWeekNumber}
          targetWeek={overview.latestWeekNumber + 1}
        />
      }
    >
      <div className="p-4">
        <WeekOverviewTable data={overview} athleteId={athleteId} />
      </div>
    </PageShell>
  );
}
```

**Step 3: Update WeekOverviewTable links**

In `src/components/trainer/WeekOverviewTable.tsx`, update `handleWeekClick` (line ~61):

```typescript
const handleWeekClick = (weekNumber: number) => {
  router.push(`/trainer/athletes/${athleteId}/week/${weekNumber}`);
};
```

**Step 4: Update CreateWeekDialog navigation**

In `src/components/trainer/CreateWeekDialog.tsx`, update `handleCreate` (line ~39):

```typescript
router.push(`/trainer/athletes/${athleteId}/week/${targetWeek}`);
```

**Step 5: Verify**

Run: `npx next build` or `npx next dev` — navigate to `/trainer/athletes/{id}` and click a week. Should navigate to `/trainer/athletes/{id}/week/{N}`.

**Step 6: Commit**

```bash
git add src/app/trainer/athletes/\[athleteId\]/week/\[weekNumber\]/page.tsx src/app/trainer/athletes/\[athleteId\]/page.tsx src/components/trainer/WeekOverviewTable.tsx src/components/trainer/CreateWeekDialog.tsx
git commit -m "feat: split week edit into dedicated /week/[weekNumber] route"
```

---

### Task 10: Fix day header duplication + add notes to AthleteWeekDay type

**Files:**
- Modify: `src/components/trainer/WeekDetailTable.tsx`
- Modify: `src/components/trainer/WeekOverviewTable.tsx`
- Modify: `src/lib/trainer/getAthleteWeek.ts` (add `notes` to day type)

**Step 1: Add notes to AthleteWeekDay**

In `src/lib/trainer/getAthleteWeek.ts`, update the type and mapping.

Update `AthleteWeekDay` type (line ~30):

```typescript
export type AthleteWeekDay = {
  id: string;
  dayIndex: number;
  label: string | null;
  notes: string | null;
  exercises: AthleteWeekExercise[];
};
```

Update the mapping (line ~125-128) to include `notes`:

```typescript
const days: AthleteWeekDay[] = workoutDays.map((day) => ({
  id: day.id,
  dayIndex: day.dayIndex,
  label: day.label,
  notes: day.notes,
  exercises: day.blocks.flatMap((block) =>
```

**Step 2: Fix day header in both components**

Create a helper function. In `WeekDetailTable.tsx`, update the day header (line ~175-181):

Replace:
```tsx
<h3 className="text-sm font-medium text-slate-900">
  D&Iacute;A {day.dayIndex}
  {day.label && (
    <span className="ml-2 font-normal text-slate-500">{day.label}</span>
  )}
</h3>
```

With:
```tsx
<h3 className="text-sm font-medium text-slate-900">
  Día {day.dayIndex}
  {day.label && !/^d[ií]a\s+\d+$/i.test(day.label) && (
    <span className="ml-2 font-normal text-slate-500">
      — {day.label}
    </span>
  )}
</h3>
```

Apply the same fix in `WeekOverviewTable.tsx` (line ~68-73):

Replace:
```tsx
<h3 className="text-sm font-medium text-slate-900">
  D&Iacute;A {day.dayIndex}
  {day.label && (
    <span className="ml-2 font-normal text-slate-500">{day.label}</span>
  )}
</h3>
```

With:
```tsx
<h3 className="text-sm font-medium text-slate-900">
  Día {day.dayIndex}
  {day.label && !/^d[ií]a\s+\d+$/i.test(day.label) && (
    <span className="ml-2 font-normal text-slate-500">
      — {day.label}
    </span>
  )}
</h3>
```

**Step 3: Verify**

Run dev server. Day headers should show "Día 1 — Pierna" when label is meaningful, just "Día 1" when label is "Día 1" or empty.

**Step 4: Commit**

```bash
git add src/components/trainer/WeekDetailTable.tsx src/components/trainer/WeekOverviewTable.tsx src/lib/trainer/getAthleteWeek.ts
git commit -m "fix: deduplicate day header labels and add notes to week day type"
```

---

### Task 11: Integrate everything into WeekDetailTable

This is the largest task — wire SetInput, InlineNote, ExercisePicker, ExerciseMenu, and duration editing into the WeekDetailTable.

**Files:**
- Modify: `src/components/trainer/WeekDetailTable.tsx` (major rewrite of the component)

**Step 1: Update the EditedSet type and imports**

At the top of `WeekDetailTable.tsx`, update types and add imports:

```tsx
"use client";

import { useState, useTransition } from "react";
import type {
  AthleteWeekData,
  AthleteWeekDay,
  AthleteWeekExercise,
  AthleteWeekSet,
} from "@/lib/trainer/getAthleteWeek";
import { updateSets } from "@/lib/trainer/actions/updateSets";
import { updateBlockSeriesCount } from "@/lib/trainer/actions/updateBlockSeriesCount";
import { updateDayNotes } from "@/lib/trainer/actions/updateDayNotes";
import { updateBlockComment } from "@/lib/trainer/actions/updateBlockComment";
import { updateExerciseComment } from "@/lib/trainer/actions/updateExerciseComment";
import { addExerciseToBlock } from "@/lib/trainer/actions/addExerciseToBlock";
import { removeExerciseFromBlock } from "@/lib/trainer/actions/removeExerciseFromBlock";
import { replaceExercise } from "@/lib/trainer/actions/replaceExercise";
import { reorderExercise } from "@/lib/trainer/actions/reorderExercise";
import { createExercise } from "@/lib/trainer/actions/createExercise";
import { searchExercises } from "@/lib/trainer/searchExercises";
import SetInput from "./SetInput";
import InlineNote from "./InlineNote";
import ExerciseMenu from "./ExerciseMenu";
import ExercisePicker from "./ExercisePicker";

type EditedSet = {
  setId: string;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
};
```

**Step 2: Update getCurrentValue to support durationSeconds**

```typescript
function getCurrentValue(
  set: AthleteWeekSet,
  field: "reps" | "weightKg" | "durationSeconds",
  editedSets: Map<string, EditedSet>
): number | null {
  const edited = editedSets.get(set.id);
  if (edited && edited[field] !== undefined) {
    return edited[field]!;
  }
  return set[field];
}
```

**Step 3: Update handleInputChange to support all three fields**

```typescript
const handleInputChange = (
  setId: string,
  field: "reps" | "weightKg" | "durationSeconds",
  value: number | null
) => {
  setEditedSets((prev) => {
    const next = new Map(prev);
    const existing = next.get(setId) ?? { setId };
    next.set(setId, { ...existing, [field]: value ?? undefined });
    return next;
  });
};
```

**Step 4: Replace raw inputs with SetInput in the series columns**

Replace the current series cell rendering in `BlockRows`. Replace the weight input + timed/reps conditional with:

```tsx
{/* Series columns */}
{Array.from({ length: globalMaxSets }, (_, i) => {
  const set = exercise.sets[i];
  if (!set) {
    return <td key={`empty-${i}`} className="px-3 py-2 text-center" />;
  }

  return (
    <td key={set.id} className="px-3 py-2 text-center">
      <div className="flex flex-col items-center gap-1">
        {hasWeight && (
          <SetInput
            value={getCurrentValue(set, "weightKg", editedSets)}
            unit="kg"
            step={2.5}
            min={0}
            max={500}
            onChange={(v) => handleInputChange(set.id, "weightKg", v)}
          />
        )}
        {isTimed ? (
          <SetInput
            value={getCurrentValue(set, "durationSeconds", editedSets)}
            unit="s"
            step={5}
            min={1}
            max={600}
            onChange={(v) => handleInputChange(set.id, "durationSeconds", v)}
          />
        ) : (
          <SetInput
            value={getCurrentValue(set, "reps", editedSets)}
            unit="reps"
            step={1}
            min={1}
            max={100}
            onChange={(v) => handleInputChange(set.id, "reps", v)}
          />
        )}
      </div>
    </td>
  );
})}
```

**Step 5: Add InlineNote for day notes**

In `DayDetail`, add after the day header `h3`:

```tsx
<div className="px-4 py-3 border-b border-slate-200">
  <h3 className="text-sm font-medium text-slate-900">
    Día {day.dayIndex}
    {day.label && !/^d[ií]a\s+\d+$/i.test(day.label) && (
      <span className="ml-2 font-normal text-slate-500">
        — {day.label}
      </span>
    )}
  </h3>
  <InlineNote
    value={day.notes ?? null}
    onSave={(v) => updateDayNotes(day.id, v)}
    placeholder="+ nota del día"
  />
</div>
```

**Step 6: Add InlineNote for block comments**

In `BlockRows`, when rendering the first exercise of a block, add a block comment note. Add a row before the exercise rows for block comment when `exIndex === 0`:

```tsx
{exIndex === 0 && block.blockComment !== undefined && (
  <tr className="border-b border-slate-100">
    <td className="sticky left-0 z-10 bg-white px-3 py-1" />
    <td colSpan={globalMaxSets + 2} className="px-3 py-1">
      <InlineNote
        value={block.blockComment}
        onSave={(v) => onBlockCommentChange(block.blockId, v)}
        placeholder="+ nota del bloque"
      />
    </td>
  </tr>
)}
```

Pass `onBlockCommentChange` down through props:
```typescript
onBlockCommentChange: (blockId: string, comment: string) => void;
```

Wire it in the parent:
```typescript
const handleBlockCommentChange = (blockId: string, comment: string) => {
  startTransition(async () => {
    await updateBlockComment(blockId, comment);
  });
};
```

**Step 7: Add InlineNote for exercise comments**

In the exercise name cell, replace the `CommentTooltip` with an `InlineNote`:

```tsx
<td className="sticky left-16 z-10 bg-white px-3 py-2 text-sm text-slate-700 min-w-[140px] align-top">
  <div className="flex items-center gap-1">
    <span>{exercise.exerciseName}</span>
    <ExerciseMenu
      onReplace={() => handleReplace(exercise.id)}
      onRemove={() => handleRemove(exercise.id)}
      onMoveUp={exIndex > 0 ? () => handleMoveUp(exercise, block, exIndex) : undefined}
      onMoveDown={exIndex < block.exercises.length - 1 ? () => handleMoveDown(exercise, block, exIndex) : undefined}
    />
  </div>
  <InlineNote
    value={exercise.exerciseComment}
    onSave={(v) => onExerciseCommentChange(exercise.id, v)}
    placeholder="+ nota"
  />
</td>
```

Pass `onExerciseCommentChange` down:
```typescript
onExerciseCommentChange: (blockExerciseId: string, comment: string) => void;
```

Wire in parent:
```typescript
const handleExerciseCommentChange = (blockExerciseId: string, comment: string) => {
  startTransition(async () => {
    await updateExerciseComment(blockExerciseId, comment);
  });
};
```

**Step 8: Add ExercisePicker and exercise CRUD handlers**

Add state to `WeekDetailTable` for the picker:

```tsx
const [pickerState, setPickerState] = useState<{
  open: boolean;
  mode: "add" | "replace";
  blockId?: string;
  blockExerciseId?: string;
}>({ open: false, mode: "add" });

const handleAddExercise = (blockId: string) => {
  setPickerState({ open: true, mode: "add", blockId });
};

const handlePickerSelect = (exerciseId: string) => {
  startTransition(async () => {
    if (pickerState.mode === "add" && pickerState.blockId) {
      await addExerciseToBlock(pickerState.blockId, exerciseId);
    } else if (pickerState.mode === "replace" && pickerState.blockExerciseId) {
      await replaceExercise(pickerState.blockExerciseId, exerciseId);
    }
  });
};

const handleRemoveExercise = (blockExerciseId: string) => {
  startTransition(async () => {
    await removeExerciseFromBlock(blockExerciseId);
  });
};

const handleReplaceExercise = (blockExerciseId: string) => {
  setPickerState({ open: true, mode: "replace", blockExerciseId });
};

const handleReorderExercise = (
  exercise: AthleteWeekExercise,
  block: ExerciseBlock,
  exIndex: number,
  direction: "up" | "down"
) => {
  const targetIndex = direction === "up" ? exIndex - 1 : exIndex + 1;
  const target = block.exercises[targetIndex];
  if (!target) return;
  startTransition(async () => {
    await reorderExercise(exercise.id, target.id);
  });
};
```

Add "+ Ejercicio" button after each block's last exercise row:

```tsx
{isLastExercise(exIndex) && (
  <tr className="border-b border-slate-100">
    <td />
    <td colSpan={globalMaxSets + 2} className="px-3 py-2">
      <button
        onClick={() => onAddExercise(block.blockId)}
        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        + Ejercicio
      </button>
    </td>
  </tr>
)}
```

Add the `ExercisePicker` at the bottom of the component's return:

```tsx
<ExercisePicker
  open={pickerState.open}
  onClose={() => setPickerState({ open: false, mode: "add" })}
  onSelect={handlePickerSelect}
  searchAction={searchExercises}
  createAction={createExercise}
/>
```

**Step 9: Pass all new callbacks through props**

Update `DayDetail` and `BlockRows` props to include all new callbacks:
- `onAddExercise`
- `onRemoveExercise`
- `onReplaceExercise`
- `onReorderExercise`
- `onBlockCommentChange`
- `onExerciseCommentChange`

Pass them down from `WeekDetailTable` → `DayDetail` → `BlockRows`.

**Step 10: Remove the CommentTooltip component**

Delete the `CommentTooltip` function from `WeekDetailTable.tsx` — it's replaced by `InlineNote`.

**Step 11: Verify**

Run: `npx next dev` — navigate to a week edit page. Verify:
- SetInput steppers work for weight, reps, and duration
- Duration fields are now editable
- Notes appear and can be edited inline
- Exercise menu shows with replace/remove/reorder options
- "+ Ejercicio" button opens the picker
- Day header shows "Día 1 — Pierna" without duplication

**Step 12: Run all tests**

Run: `bun test`
Expected: ALL PASS

**Step 13: Commit**

```bash
git add src/components/trainer/WeekDetailTable.tsx
git commit -m "feat: integrate SetInput, InlineNote, ExercisePicker, and ExerciseMenu into WeekDetailTable"
```

---

### Task 12: Final cleanup and type check

**Step 1: Run type check**

Run: `npm run type-check`
Fix any TypeScript errors that arise.

**Step 2: Run linter**

Run: `npm run lint`
Fix any lint issues.

**Step 3: Run full test suite**

Run: `bun test`
Expected: ALL PASS

**Step 4: Commit any fixes**

```bash
git add -u
git commit -m "chore: fix type and lint issues from trainer edit page integration"
```

---

## Task Dependency Graph

```
Task 1 (updateSets durationSeconds) ──┐
Task 2 (note actions) ────────────────┤
Task 3 (exercise CRUD actions) ───────┤
                                       ├── Task 10 (day header fix) ── Task 11 (integrate all) ── Task 12 (cleanup)
Task 4 (SetInput component) ──────────┤
Task 5 (InlineNote component) ────────┤
Task 6 (ExercisePicker component) ────┤
Task 7 (ExerciseMenu component) ──────┤
Task 8 (createExercise action) ───────┤
Task 9 (route change) ────────────────┘
```

Tasks 1–9 can be done in parallel. Task 10 depends on nothing but should be done before 11. Task 11 integrates everything. Task 12 is final verification.
