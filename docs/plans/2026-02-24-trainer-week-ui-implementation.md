# Trainer Week UI Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the trainer's single-week view with a multi-week overview + per-week detail editor, matching the spreadsheet workflow.

**Architecture:** Two views on the same route (`/trainer/athletes/[athleteId]`). No `?week=` param → multi-week overview (read-only grid). `?week=N` → single-week detail editor with series-as-columns. New `getAthleteOverview` query for the overview, existing `getAthleteWeek` for the detail view. New `updateBlockSeriesCount` action for adding/removing series.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, Prisma 7, TypeScript 5.9, Tailwind CSS, Bun test

**Key files to reference:**
- Schema: `schema.prisma`
- Design doc: `docs/plans/2026-02-24-trainer-week-ui-redesign.md`
- Existing query pattern: `src/lib/trainer/getAthleteWeek.ts`
- Existing action pattern: `src/lib/trainer/actions/updateSets.ts`
- Existing test pattern: `src/lib/trainer/__tests__/updateSets.test.ts`
- Factory helpers: `test/helpers/factories/` (userFactory, exerciseFactory, workoutDayFactory, workoutBlockFactory, workoutBlockExerciseFactory, setFactory)
- DB cleanup: `test/helpers/test-helpers.ts` (truncateDb)

---

### Task 1: `getAthleteOverview` query

**Files:**
- Create: `src/lib/trainer/getAthleteOverview.ts`
- Test: `src/lib/trainer/__tests__/getAthleteOverview.test.ts`

This query fetches ALL weeks for an athlete, grouped by day. It powers the multi-week overview grid.

**Step 1: Write the types and query**

Create `src/lib/trainer/getAthleteOverview.ts`:

```typescript
import { cache } from "react";
import prisma from "../prisma";

export type OverviewSet = {
  setIndex: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
};

export type OverviewExercise = {
  exerciseId: string;
  exerciseName: string;
  blockLabel: string; // "A", "B", "C"
  blockComment: string | null;
  exerciseOrder: number; // 1, 2 within block
  exerciseComment: string | null;
  sets: OverviewSet[];
};

export type OverviewWeek = {
  weekNumber: number;
  weekStartDate: Date;
  exercises: OverviewExercise[];
};

export type OverviewDay = {
  dayIndex: number;
  label: string | null;
  notes: string | null; // warmup note
  weeks: OverviewWeek[];
};

export type AthleteOverviewData = {
  athlete: { id: string; name: string };
  latestWeekNumber: number;
  days: OverviewDay[];
};

export const getAthleteOverview = cache(async function getAthleteOverview(
  athleteId: string
): Promise<AthleteOverviewData | null> {
  const athlete = await prisma.user.findUnique({
    where: { id: athleteId },
    select: { id: true, name: true, email: true },
  });

  if (!athlete) return null;

  const workoutDays = await prisma.workoutDay.findMany({
    where: { athleteId },
    include: {
      blocks: {
        include: {
          exercises: {
            include: {
              exercise: true,
              sets: { orderBy: { setIndex: "asc" } },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
  });

  if (workoutDays.length === 0) return null;

  // Group by dayIndex
  const dayMap = new Map<number, { label: string | null; notes: string | null; weeks: OverviewWeek[] }>();

  for (const day of workoutDays) {
    if (!dayMap.has(day.dayIndex)) {
      dayMap.set(day.dayIndex, {
        label: day.label,
        notes: day.notes,
        weeks: [],
      });
    }

    const exercises: OverviewExercise[] = day.blocks.flatMap((block) =>
      block.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exercise.name,
        blockLabel: block.label ?? "",
        blockComment: block.comment,
        exerciseOrder: ex.order,
        exerciseComment: ex.comment,
        sets: ex.sets.map((set) => ({
          setIndex: set.setIndex,
          reps: set.reps,
          weightKg: set.weightKg,
          durationSeconds: set.durationSeconds,
          repsPerSide: set.repsPerSide,
        })),
      }))
    );

    dayMap.get(day.dayIndex)!.weeks.push({
      weekNumber: day.weekNumber,
      weekStartDate: day.weekStartDate,
      exercises,
    });
  }

  const days: OverviewDay[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayIndex, data]) => ({
      dayIndex,
      label: data.label,
      notes: data.notes,
      weeks: data.weeks,
    }));

  const latestWeekNumber = Math.max(...workoutDays.map((d) => d.weekNumber));

  return {
    athlete: {
      id: athlete.id,
      name: athlete.name ?? athlete.email.split("@")[0] ?? "Unknown",
    },
    latestWeekNumber,
    days,
  };
});
```

**Step 2: Write tests**

Create `src/lib/trainer/__tests__/getAthleteOverview.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { getAthleteOverview } from "../getAthleteOverview";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getAthleteOverview", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns null for unknown athlete", async () => {
    const result = await getAthleteOverview("nonexistent-id");
    expect(result).toBeNull();
  });

  test("returns null when athlete has no workouts", async () => {
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const result = await getAthleteOverview(athlete.id);
    expect(result).toBeNull();
  });

  test("groups workouts by day across weeks", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete, name: "Toni" });
    const exercise = await exerciseFactory.create({ name: "Sentadilla" });

    // Create 2 weeks, each with day 1
    for (const [i, weekNum] of [3, 4].entries()) {
      const day = await workoutDayFactory.create({
        trainer: { connect: { id: trainer.id } },
        athlete: { connect: { id: athlete.id } },
        weekNumber: weekNum,
        weekStartDate: new Date(`2025-01-${19 + i * 7}`),
        dayIndex: 1,
        label: "Día 1",
        notes: "Entrada en calor: Movilidad A o B",
      });

      const block = await workoutBlockFactory.create({
        workoutDay: { connect: { id: day.id } },
        order: 1,
        label: "A",
      });

      const wbe = await workoutBlockExerciseFactory.create({
        exercise: { connect: { id: exercise.id } },
        workoutBlock: { connect: { id: block.id } },
        order: 1,
      });

      await setFactory.create({
        workoutBlockExercise: { connect: { id: wbe.id } },
        setIndex: 1,
        reps: 3 + i,
        weightKg: null,
      });
    }

    const result = await getAthleteOverview(athlete.id);

    expect(result).not.toBeNull();
    expect(result!.athlete.name).toBe("Toni");
    expect(result!.latestWeekNumber).toBe(4);
    expect(result!.days).toHaveLength(1); // one day
    expect(result!.days[0].weeks).toHaveLength(2); // two weeks
    expect(result!.days[0].weeks[0].weekNumber).toBe(3);
    expect(result!.days[0].weeks[1].weekNumber).toBe(4);
    expect(result!.days[0].weeks[0].exercises[0].sets[0].reps).toBe(3);
    expect(result!.days[0].weeks[1].exercises[0].sets[0].reps).toBe(4);
  });

  test("includes block label and exercise info", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create({ name: "Peso muerto" });

    const day = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 3,
      dayIndex: 1,
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day.id } },
      order: 1,
      label: "B",
      comment: "Rest 2 min between sets",
    });

    const wbe = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
      comment: "Keep back straight",
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: wbe.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 100,
    });

    const result = await getAthleteOverview(athlete.id);
    const ex = result!.days[0].weeks[0].exercises[0];

    expect(ex.blockLabel).toBe("B");
    expect(ex.blockComment).toBe("Rest 2 min between sets");
    expect(ex.exerciseComment).toBe("Keep back straight");
    expect(ex.exerciseName).toBe("Peso muerto");
  });
});
```

**Step 3: Run tests**

Run: `bun test src/lib/trainer/__tests__/getAthleteOverview.test.ts`
Expected: All 4 tests PASS

**Step 4: Commit**

```bash
git add src/lib/trainer/getAthleteOverview.ts src/lib/trainer/__tests__/getAthleteOverview.test.ts
git commit -m "feat(trainer): add getAthleteOverview query"
```

---

### Task 2: `formatSetsCompact` utility

**Files:**
- Create: `src/lib/trainer/formatSetsCompact.ts`
- Test: `src/lib/trainer/__tests__/formatSetsCompact.test.ts`

Pure function that formats an array of sets into compact spreadsheet notation. No DB access — unit tests only.

**Step 1: Write tests first**

Create `src/lib/trainer/__tests__/formatSetsCompact.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { formatSetsCompact } from "../formatSetsCompact";

describe("formatSetsCompact", () => {
  test("bodyweight same reps: 3-3-3", () => {
    const sets = [
      { reps: 3, weightKg: null, durationSeconds: null, repsPerSide: false },
      { reps: 3, weightKg: null, durationSeconds: null, repsPerSide: false },
      { reps: 3, weightKg: null, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("3-3-3");
  });

  test("bodyweight varying reps: 10-8-8", () => {
    const sets = [
      { reps: 10, weightKg: null, durationSeconds: null, repsPerSide: false },
      { reps: 8, weightKg: null, durationSeconds: null, repsPerSide: false },
      { reps: 8, weightKg: null, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("10-8-8");
  });

  test("weighted same weight: 100/8-8-6", () => {
    const sets = [
      { reps: 8, weightKg: 100, durationSeconds: null, repsPerSide: false },
      { reps: 8, weightKg: 100, durationSeconds: null, repsPerSide: false },
      { reps: 6, weightKg: 100, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("100/8-8-6");
  });

  test("weighted mixed: 60/5 - 85/4 - 100/3-3-2", () => {
    const sets = [
      { reps: 5, weightKg: 60, durationSeconds: null, repsPerSide: false },
      { reps: 4, weightKg: 85, durationSeconds: null, repsPerSide: false },
      { reps: 3, weightKg: 100, durationSeconds: null, repsPerSide: false },
      { reps: 3, weightKg: 100, durationSeconds: null, repsPerSide: false },
      { reps: 2, weightKg: 100, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("60/5 - 85/4 - 100/3-3-2");
  });

  test("timed: 3x40s", () => {
    const sets = [
      { reps: null, weightKg: null, durationSeconds: 40, repsPerSide: false },
      { reps: null, weightKg: null, durationSeconds: 40, repsPerSide: false },
      { reps: null, weightKg: null, durationSeconds: 40, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("3x40s");
  });

  test("timed mixed durations: 40s-50s-50s", () => {
    const sets = [
      { reps: null, weightKg: null, durationSeconds: 40, repsPerSide: false },
      { reps: null, weightKg: null, durationSeconds: 50, repsPerSide: false },
      { reps: null, weightKg: null, durationSeconds: 50, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("40s-50s-50s");
  });

  test("per-side appends c/l: 8-8-6 c/l", () => {
    const sets = [
      { reps: 8, weightKg: null, durationSeconds: null, repsPerSide: true },
      { reps: 8, weightKg: null, durationSeconds: null, repsPerSide: true },
      { reps: 6, weightKg: null, durationSeconds: null, repsPerSide: true },
    ];
    expect(formatSetsCompact(sets)).toBe("8-8-6 c/l");
  });

  test("weighted per-side: 15/6-6-6 c/l", () => {
    const sets = [
      { reps: 6, weightKg: 15, durationSeconds: null, repsPerSide: true },
      { reps: 6, weightKg: 15, durationSeconds: null, repsPerSide: true },
      { reps: 6, weightKg: 15, durationSeconds: null, repsPerSide: true },
    ];
    expect(formatSetsCompact(sets)).toBe("15/6-6-6 c/l");
  });

  test("decimal weight: 17,5/4-4-4", () => {
    const sets = [
      { reps: 4, weightKg: 17.5, durationSeconds: null, repsPerSide: false },
      { reps: 4, weightKg: 17.5, durationSeconds: null, repsPerSide: false },
      { reps: 4, weightKg: 17.5, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("17,5/4-4-4");
  });

  test("empty sets returns empty string", () => {
    expect(formatSetsCompact([])).toBe("");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/lib/trainer/__tests__/formatSetsCompact.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement**

Create `src/lib/trainer/formatSetsCompact.ts`:

```typescript
type SetInput = {
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
};

function formatWeight(kg: number): string {
  return kg % 1 === 0 ? String(kg) : String(kg).replace(".", ",");
}

export function formatSetsCompact(sets: SetInput[]): string {
  if (sets.length === 0) return "";

  const perSide = sets.some((s) => s.repsPerSide);
  const suffix = perSide ? " c/l" : "";

  // Timed exercises
  if (sets[0].durationSeconds !== null) {
    const allSame = sets.every((s) => s.durationSeconds === sets[0].durationSeconds);
    if (allSame) {
      return `${sets.length}x${sets[0].durationSeconds}s`;
    }
    return sets.map((s) => `${s.durationSeconds}s`).join("-");
  }

  // Bodyweight (no weight)
  const hasWeight = sets.some((s) => s.weightKg !== null && s.weightKg > 0);
  if (!hasWeight) {
    return sets.map((s) => String(s.reps ?? 0)).join("-") + suffix;
  }

  // Weighted — group consecutive same-weight sets
  const groups: { weightKg: number; reps: number[] }[] = [];

  for (const set of sets) {
    const w = set.weightKg ?? 0;
    const r = set.reps ?? 0;
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.weightKg === w) {
      lastGroup.reps.push(r);
    } else {
      groups.push({ weightKg: w, reps: [r] });
    }
  }

  const parts = groups.map((g) => {
    const w = formatWeight(g.weightKg);
    const r = g.reps.join("-");
    return `${w}/${r}`;
  });

  return parts.join(" - ") + suffix;
}
```

**Step 4: Run tests**

Run: `bun test src/lib/trainer/__tests__/formatSetsCompact.test.ts`
Expected: All 10 tests PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/formatSetsCompact.ts src/lib/trainer/__tests__/formatSetsCompact.test.ts
git commit -m "feat(trainer): add formatSetsCompact utility"
```

---

### Task 3: `updateBlockSeriesCount` server action

**Files:**
- Create: `src/lib/trainer/actions/updateBlockSeriesCount.ts`
- Test: `src/lib/trainer/__tests__/updateBlockSeriesCount.test.ts`

Adds or removes sets from all exercises in a block.

**Step 1: Write tests first**

Create `src/lib/trainer/__tests__/updateBlockSeriesCount.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { updateBlockSeriesCount } from "../actions/updateBlockSeriesCount";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

async function createBlockWith2Exercises(seriesCount: number) {
  const trainer = await userFactory.create({ role: UserRole.trainer });
  const athlete = await userFactory.create({ role: UserRole.athlete });
  const ex1 = await exerciseFactory.create({ name: "Exercise A" });
  const ex2 = await exerciseFactory.create({ name: "Exercise B" });

  const day = await workoutDayFactory.create({
    trainer: { connect: { id: trainer.id } },
    athlete: { connect: { id: athlete.id } },
    weekNumber: 5,
    dayIndex: 1,
  });

  const block = await workoutBlockFactory.create({
    workoutDay: { connect: { id: day.id } },
    order: 1,
    label: "A",
  });

  const wbe1 = await workoutBlockExerciseFactory.create({
    exercise: { connect: { id: ex1.id } },
    workoutBlock: { connect: { id: block.id } },
    order: 1,
  });

  const wbe2 = await workoutBlockExerciseFactory.create({
    exercise: { connect: { id: ex2.id } },
    workoutBlock: { connect: { id: block.id } },
    order: 2,
  });

  for (const wbe of [wbe1, wbe2]) {
    for (let i = 1; i <= seriesCount; i++) {
      await setFactory.create({
        workoutBlockExercise: { connect: { id: wbe.id } },
        setIndex: i,
        reps: 8,
        weightKg: 60,
      });
    }
  }

  return { block, wbe1, wbe2 };
}

describe("updateBlockSeriesCount", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("adds a series to all exercises in a block", async () => {
    const { block, wbe1, wbe2 } = await createBlockWith2Exercises(3);

    await updateBlockSeriesCount(block.id, 4);

    const sets1 = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe1.id },
      orderBy: { setIndex: "asc" },
    });
    const sets2 = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe2.id },
      orderBy: { setIndex: "asc" },
    });

    expect(sets1).toHaveLength(4);
    expect(sets2).toHaveLength(4);
    expect(sets1[3].setIndex).toBe(4);
    expect(sets1[3].reps).toBeNull();
    expect(sets1[3].weightKg).toBeNull();
  });

  test("removes last series from all exercises in a block", async () => {
    const { block, wbe1, wbe2 } = await createBlockWith2Exercises(3);

    await updateBlockSeriesCount(block.id, 2);

    const sets1 = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe1.id },
    });
    const sets2 = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe2.id },
    });

    expect(sets1).toHaveLength(2);
    expect(sets2).toHaveLength(2);
  });

  test("does nothing when count is the same", async () => {
    const { block, wbe1 } = await createBlockWith2Exercises(3);

    await updateBlockSeriesCount(block.id, 3);

    const sets = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe1.id },
    });
    expect(sets).toHaveLength(3);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/lib/trainer/__tests__/updateBlockSeriesCount.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement**

Create `src/lib/trainer/actions/updateBlockSeriesCount.ts`:

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateBlockSeriesCount(
  blockId: string,
  newCount: number
): Promise<void> {
  const block = await prisma.workoutBlock.findUnique({
    where: { id: blockId },
    include: {
      exercises: {
        include: {
          sets: { orderBy: { setIndex: "asc" } },
        },
      },
    },
  });

  if (!block) return;

  const operations: Parameters<typeof prisma.$transaction>[0] = [];

  for (const exercise of block.exercises) {
    const currentCount = exercise.sets.length;

    if (newCount > currentCount) {
      // Add sets
      for (let i = currentCount + 1; i <= newCount; i++) {
        operations.push(
          prisma.set.create({
            data: {
              workoutBlockExerciseId: exercise.id,
              setIndex: i,
              reps: null,
              weightKg: null,
              repsPerSide: false,
            },
          })
        );
      }
    } else if (newCount < currentCount) {
      // Remove sets with highest setIndex
      const setsToRemove = exercise.sets.slice(newCount);
      for (const set of setsToRemove) {
        operations.push(prisma.set.delete({ where: { id: set.id } }));
      }
    }
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  revalidatePath("/trainer/athletes");
}
```

**Step 4: Run tests**

Run: `bun test src/lib/trainer/__tests__/updateBlockSeriesCount.test.ts`
Expected: All 3 tests PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/actions/updateBlockSeriesCount.ts src/lib/trainer/__tests__/updateBlockSeriesCount.test.ts
git commit -m "feat(trainer): add updateBlockSeriesCount action"
```

---

### Task 4: `WeekOverviewTable` component

**Files:**
- Create: `src/components/trainer/WeekOverviewTable.tsx`

Client component that renders the multi-week overview grid. Uses `formatSetsCompact` for cell values.

**Step 1: Implement the component**

Create `src/components/trainer/WeekOverviewTable.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import type { AthleteOverviewData, OverviewSet } from "@/lib/trainer/getAthleteOverview";
import { formatSetsCompact } from "@/lib/trainer/formatSetsCompact";
import { format } from "date-fns";
import { useState } from "react";

type Props = {
  data: AthleteOverviewData;
  athleteId: string;
};

export default function WeekOverviewTable({ data, athleteId }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {data.days.map((day) => (
        <DayOverview
          key={day.dayIndex}
          day={day}
          athleteId={athleteId}
          onWeekClick={(weekNumber) =>
            router.push(`/trainer/athletes/${athleteId}?week=${weekNumber}`)
          }
        />
      ))}
    </div>
  );
}

function DayOverview({
  day,
  athleteId,
  onWeekClick,
}: {
  day: AthleteOverviewData["days"][number];
  athleteId: string;
  onWeekClick: (weekNumber: number) => void;
}) {
  if (day.weeks.length === 0) return null;

  // Build exercise rows from first week's structure (exercise ordering)
  // Each row = { blockLabel, exerciseOrder, exerciseName, exerciseComment, blockComment, weekCells: string[] }
  const firstWeek = day.weeks[0];
  const exerciseRows = firstWeek.exercises.map((ex) => ({
    blockLabel: `${ex.blockLabel}${ex.exerciseOrder}`,
    exerciseName: ex.exerciseName,
    exerciseComment: ex.exerciseComment,
    blockComment: ex.blockComment,
    weekCells: day.weeks.map((week) => {
      const matchingEx = week.exercises.find(
        (e) => e.blockLabel === ex.blockLabel && e.exerciseOrder === ex.exerciseOrder
      );
      return matchingEx ? formatSetsCompact(matchingEx.sets) : "—";
    }),
  }));

  // Detect block boundaries for visual separation
  const blockBoundaries = new Set<number>();
  for (let i = 1; i < exerciseRows.length; i++) {
    const prev = firstWeek.exercises[i - 1].blockLabel;
    const curr = firstWeek.exercises[i].blockLabel;
    if (prev !== curr) blockBoundaries.add(i);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Day header */}
      <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">
          DÍA {day.dayIndex}
        </h3>
        {day.notes && (
          <p className="text-xs text-slate-500 mt-0.5">{day.notes}</p>
        )}
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 sticky left-0 bg-slate-50 z-10 w-16">
                Bloque
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 sticky left-16 bg-slate-50 z-10 min-w-[140px]">
                Ejercicio
              </th>
              {day.weeks.map((week) => (
                <th
                  key={week.weekNumber}
                  className="text-center px-3 py-2 text-xs font-medium text-slate-600 min-w-[120px] cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => onWeekClick(week.weekNumber)}
                >
                  <div>Sem {week.weekNumber}</div>
                  <div className="text-slate-400 font-normal">
                    {format(week.weekStartDate, "dd/MM")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exerciseRows.map((row, i) => (
              <tr
                key={`${row.blockLabel}-${i}`}
                className={`border-b border-slate-100 last:border-0 ${
                  blockBoundaries.has(i) ? "border-t-2 border-t-slate-200" : ""
                }`}
              >
                <td className="px-3 py-2 text-xs font-medium text-slate-500 sticky left-0 bg-white z-10">
                  {row.blockLabel}
                </td>
                <td className="px-3 py-2 text-sm text-slate-700 sticky left-16 bg-white z-10">
                  <span className="flex items-center gap-1">
                    {row.exerciseName}
                    {(row.exerciseComment || row.blockComment) && (
                      <CommentTooltip
                        exerciseComment={row.exerciseComment}
                        blockComment={row.blockComment}
                      />
                    )}
                  </span>
                </td>
                {row.weekCells.map((cell, j) => (
                  <td
                    key={j}
                    className="px-3 py-2 text-center text-xs text-slate-600 whitespace-nowrap"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommentTooltip({
  exerciseComment,
  blockComment,
}: {
  exerciseComment: string | null;
  blockComment: string | null;
}) {
  const [show, setShow] = useState(false);
  const comment = exerciseComment || blockComment || "";

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-slate-400 cursor-help text-xs">ℹ</span>
      {show && (
        <div className="absolute bottom-full left-0 mb-1 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg max-w-xs z-50 whitespace-normal">
          {comment}
        </div>
      )}
    </span>
  );
}
```

**Step 2: Visually verify**

This will be wired up in Task 6. For now, just ensure the file has no syntax errors:

Run: `npx tsc --noEmit 2>&1 | grep WeekOverviewTable || echo "No type errors"`

**Step 3: Commit**

```bash
git add src/components/trainer/WeekOverviewTable.tsx
git commit -m "feat(trainer): add WeekOverviewTable component"
```

---

### Task 5: `WeekDetailTable` component

**Files:**
- Create: `src/components/trainer/WeekDetailTable.tsx`

Client component for the per-week editing view with series-as-columns layout.

**Step 1: Implement the component**

Create `src/components/trainer/WeekDetailTable.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import type { AthleteWeekData } from "@/lib/trainer/getAthleteWeek";
import { updateSets } from "@/lib/trainer/actions/updateSets";
import { updateBlockSeriesCount } from "@/lib/trainer/actions/updateBlockSeriesCount";

type Props = {
  data: AthleteWeekData;
};

type EditedCell = {
  setId: string;
  reps?: number;
  weightKg?: number;
};

export default function WeekDetailTable({ data }: Props) {
  const [editedSets, setEditedSets] = useState<Map<string, EditedCell>>(new Map());
  const [isPending, startTransition] = useTransition();

  const hasChanges = editedSets.size > 0;

  function handleChange(setId: string, field: "reps" | "weightKg", value: string) {
    const numValue = value === "" ? undefined : parseFloat(value);
    setEditedSets((prev) => {
      const next = new Map(prev);
      const existing = next.get(setId) ?? { setId };
      next.set(setId, { ...existing, [field]: numValue });
      return next;
    });
  }

  function handleSave() {
    const updates = Array.from(editedSets.values()).filter(
      (u) => u.reps !== undefined || u.weightKg !== undefined
    );
    if (updates.length === 0) return;

    startTransition(async () => {
      await updateSets(updates);
      setEditedSets(new Map());
    });
  }

  function handleSeriesChange(blockId: string, currentCount: number, delta: number) {
    const newCount = currentCount + delta;
    if (newCount < 1) return;

    startTransition(async () => {
      await updateBlockSeriesCount(blockId, newCount);
    });
  }

  return (
    <div>
      <div className="space-y-8">
        {data.days.map((day) => (
          <DayDetail
            key={day.dayIndex}
            day={day}
            editedSets={editedSets}
            onChange={handleChange}
            onSeriesChange={handleSeriesChange}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasChanges && !isPending
              ? "bg-slate-800 text-white hover:bg-slate-700"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
```

The `DayDetail` subcomponent renders each day's blocks with series as columns. Each exercise row shows its sets horizontally. The block label column shows "A1", "A2", etc. Cells contain weight input (top, hidden for bodyweight) and reps input (bottom). `[+][-]` buttons appear on the last exercise row of each block.

This component reuses the `AthleteWeekData` type from `getAthleteWeek`, but it needs block info (blockId, blockLabel) which the current type flattens away. **The `getAthleteWeek` query must be updated to include block info** — see Task 6.

The full component implementation should follow the layout described in the design doc. The key data structures:

- Group `day.exercises` back into blocks (by looking at consecutive exercises)
- Find max series count per block
- Render columns: Bloque | Ejercicio | Serie 1 | ... | Serie N | [+][-]

**Step 2: Commit**

```bash
git add src/components/trainer/WeekDetailTable.tsx
git commit -m "feat(trainer): add WeekDetailTable component"
```

---

### Task 6: Update `getAthleteWeek` to include block info

**Files:**
- Modify: `src/lib/trainer/getAthleteWeek.ts`
- Modify: `src/lib/trainer/__tests__/getAthleteWeek.test.ts`

The current query flattens blocks into a flat exercise list per day. The new `WeekDetailTable` needs block IDs and labels to group exercises and add/remove series.

**Step 1: Update types**

Add to `AthleteWeekExercise`:
```typescript
export type AthleteWeekExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  blockId: string;        // NEW
  blockLabel: string;     // NEW
  blockComment: string | null; // NEW
  exerciseOrder: number;  // NEW — order within block (1, 2)
  exerciseComment: string | null; // NEW
  sets: AthleteWeekSet[];
};
```

**Step 2: Update the mapping in `getAthleteWeek`** (around line 123-146)

Change the `day.blocks.flatMap` to include block fields:
```typescript
exercises: day.blocks.flatMap((block) =>
  block.exercises.map((ex) => ({
    id: ex.id,
    exerciseId: ex.exerciseId,
    exerciseName: ex.exercise.name,
    blockId: block.id,
    blockLabel: block.label ?? "",
    blockComment: block.comment,
    exerciseOrder: ex.order,
    exerciseComment: ex.comment,
    sets: ex.sets.map((set) => ({
      // ... existing set mapping unchanged
    })),
  }))
),
```

**Step 3: Update tests**

Add a test that verifies block info is included:

```typescript
test("includes block info on exercises", async () => {
  // ... create workout with block label "B" and comment
  const result = await getAthleteWeek(athlete.id, 5);
  const ex = result!.days[0].exercises[0];

  expect(ex.blockId).toBeDefined();
  expect(ex.blockLabel).toBe("B");
  expect(ex.blockComment).toBe("Rest 2 min");
  expect(ex.exerciseOrder).toBe(1);
});
```

**Step 4: Run tests**

Run: `bun test src/lib/trainer/__tests__/getAthleteWeek.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/getAthleteWeek.ts src/lib/trainer/__tests__/getAthleteWeek.test.ts
git commit -m "feat(trainer): include block info in getAthleteWeek"
```

---

### Task 7: Update athlete page to support both views

**Files:**
- Modify: `src/app/trainer/athletes/[athleteId]/page.tsx`
- Modify: `src/components/trainer/CreateWeekDialogTrigger.tsx`

This is the main wiring task. The page renders either the overview or the detail view based on the `?week=` param.

**Step 1: Rewrite the page**

Replace the content of `src/app/trainer/athletes/[athleteId]/page.tsx`:

```tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import { getAthleteOverview } from "@/lib/trainer/getAthleteOverview";
import WeekOverviewTable from "@/components/trainer/WeekOverviewTable";
import WeekDetailTable from "@/components/trainer/WeekDetailTable";
import CreateWeekDialogTrigger from "@/components/trainer/CreateWeekDialogTrigger";
import { format } from "date-fns";

type AthleteWeekPageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ week?: string }>;
};

export default async function AthleteWeekPage({
  params,
  searchParams,
}: AthleteWeekPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/");

  const { athleteId } = await params;
  const { week } = await searchParams;

  // Detail view: ?week=N
  if (week) {
    const weekNumber = parseInt(week, 10);
    if (isNaN(weekNumber)) notFound();

    const weekData = await getAthleteWeek(athleteId, weekNumber);
    if (!weekData) notFound();

    return (
      <main className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/trainer/athletes/${athleteId}`}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
              >
                {/* back arrow SVG */}
                <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </Link>
              <h1 className="text-lg font-semibold text-slate-900">
                {weekData.athlete.name} — Semana {weekNumber}
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({format(weekData.weekStartDate, "dd/MM")})
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {weekData.previousWeekExists ? (
                <Link
                  href={`/trainer/athletes/${athleteId}?week=${weekNumber - 1}`}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ← Sem {weekNumber - 1}
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-sm text-slate-300">
                  ← Sem {weekNumber - 1}
                </span>
              )}

              {weekData.nextWeekExists ? (
                <Link
                  href={`/trainer/athletes/${athleteId}?week=${weekNumber + 1}`}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Sem {weekNumber + 1} →
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-sm text-slate-300">
                  Sem {weekNumber + 1} →
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="p-4">
          <WeekDetailTable data={weekData} />
        </div>
      </main>
    );
  }

  // Overview view: no ?week= param
  const overview = await getAthleteOverview(athleteId);

  if (!overview) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/trainer/athletes"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
            >
              <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">Sin entrenamientos</h1>
          </div>
        </header>
        <div className="p-4 text-center text-slate-500">
          Este atleta no tiene entrenamientos programados.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/trainer/athletes"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
            >
              <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">
              {overview.athlete.name}
            </h1>
          </div>

          <CreateWeekDialogTrigger
            athleteId={athleteId}
            trainerId={user.id}
            sourceWeek={overview.latestWeekNumber}
            targetWeek={overview.latestWeekNumber + 1}
          />
        </div>
      </header>

      <div className="p-4">
        <WeekOverviewTable data={overview} athleteId={athleteId} />
      </div>
    </main>
  );
}
```

**Step 2: Update `CreateWeekDialogTrigger`**

Change from auto-opening to button-triggered:

```tsx
"use client";

import { useState } from "react";
import CreateWeekDialog from "./CreateWeekDialog";

type Props = {
  athleteId: string;
  trainerId: string;
  sourceWeek: number;
  targetWeek: number;
};

export default function CreateWeekDialogTrigger({
  athleteId,
  trainerId,
  sourceWeek,
  targetWeek,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
      >
        + Semana
      </button>

      <CreateWeekDialog
        open={open}
        onClose={() => setOpen(false)}
        athleteId={athleteId}
        trainerId={trainerId}
        sourceWeek={sourceWeek}
        targetWeek={targetWeek}
      />
    </>
  );
}
```

**Step 3: Visually verify**

Run: `bun run dev`
- Navigate to `/trainer/athletes/{id}` — should show the multi-week overview
- Click a week column header — should navigate to `?week=N` detail view
- Click "← Overview" — should go back to overview
- Click "+ Semana" — should open the dialog
- Cancel dialog — should just close it (no broken state)

**Step 4: Commit**

```bash
git add src/app/trainer/athletes/\[athleteId\]/page.tsx src/components/trainer/CreateWeekDialogTrigger.tsx
git commit -m "feat(trainer): wire up overview and detail views"
```

---

### Task 8: Polish and verify

**Files:**
- All modified files from previous tasks

**Step 1: Run full test suite**

Run: `bun test`
Expected: All tests PASS (existing + new)

**Step 2: Visual smoke test**

Check these scenarios:
- Overview: all days render, all weeks visible, horizontal scroll works
- Overview: sticky columns work when scrolling
- Overview: comment tooltips appear on hover
- Detail: clicking a week opens the editor
- Detail: editing reps/weight and saving works
- Detail: [+][-] buttons add/remove series
- Detail: "← Overview" link works
- Detail: prev/next week navigation works (disabled at boundaries)
- Empty state: athlete with no workouts shows "Sin entrenamientos"

**Step 3: Commit any fixes**

```bash
git add -u
git commit -m "fix(trainer): polish week UI"
```
