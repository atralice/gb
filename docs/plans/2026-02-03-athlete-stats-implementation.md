# Athlete Stats Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/stats` page showing weekly completion, adherence, and personal records for athletes.

**Architecture:** Server component page with a single data query function. Three presentational card components. Navigation via UserMenu dropdown.

**Tech Stack:** Next.js App Router, Prisma, Tailwind CSS, bun:test

---

## Task 1: Create getAthleteStats Query Function

**Files:**
- Create: `src/lib/stats/getAthleteStats.ts`
- Test: `src/lib/stats/__tests__/getAthleteStats.test.ts`

### Step 1: Write the failing test for weekly completion

```typescript
// src/lib/stats/__tests__/getAthleteStats.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { getAthleteStats } from "../getAthleteStats";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getAthleteStats", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  describe("weeklyCompletion", () => {
    test("counts completed, skipped, and total sets for current week", async () => {
      const trainer = await userFactory.create({ role: UserRole.trainer });
      const athlete = await userFactory.create({ role: UserRole.athlete });
      const exercise = await exerciseFactory.create();

      // Current week (use a Monday as weekStartDate)
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      monday.setHours(0, 0, 0, 0);

      const workoutDay = await workoutDayFactory.create({
        trainer: { connect: { id: trainer.id } },
        athlete: { connect: { id: athlete.id } },
        weekStartDate: monday,
        weekNumber: 1,
        dayIndex: 1,
      });

      const block = await workoutBlockFactory.create({
        workoutDay: { connect: { id: workoutDay.id } },
        order: 1,
      });

      const workoutExercise = await workoutBlockExerciseFactory.create({
        exercise: { connect: { id: exercise.id } },
        workoutBlock: { connect: { id: block.id } },
        order: 1,
      });

      // 3 completed, 2 skipped, 1 pending = 6 total
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 1,
        completed: true,
      });
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 2,
        completed: true,
      });
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 3,
        completed: true,
      });
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 4,
        skipped: true,
      });
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 5,
        skipped: true,
      });
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 6,
        completed: false,
        skipped: false,
      });

      const result = await getAthleteStats(athlete.id, "week");

      expect(result.weeklyCompletion).toEqual({
        completed: 3,
        skipped: 2,
        total: 6,
      });
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `bun test src/lib/stats/__tests__/getAthleteStats.test.ts`
Expected: FAIL - module not found

### Step 3: Write minimal implementation for weekly completion

```typescript
// src/lib/stats/getAthleteStats.ts
import { cache } from "react";
import prisma from "../prisma";

export type AthleteStats = {
  weeklyCompletion: {
    completed: number;
    skipped: number;
    total: number;
  };
  adherence: {
    range: "week" | "month";
    avgWeightDiff: number | null;
    avgRepsDiff: number | null;
  };
  personalRecords: Array<{
    exerciseName: string;
    weightKg: number;
    achievedAt: Date;
  }>;
};

function getCurrentWeekStart(): Date {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getMonthAgo(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export const getAthleteStats = cache(async function getAthleteStats(
  athleteId: string,
  adherenceRange: "week" | "month"
): Promise<AthleteStats> {
  const currentWeekStart = getCurrentWeekStart();

  // Weekly completion - sets from current week
  const weeklyStats = await prisma.set.aggregate({
    where: {
      workoutBlockExercise: {
        workoutBlock: {
          workoutDay: {
            athleteId,
            weekStartDate: currentWeekStart,
          },
        },
      },
    },
    _count: { id: true },
  });

  const completedCount = await prisma.set.count({
    where: {
      workoutBlockExercise: {
        workoutBlock: {
          workoutDay: {
            athleteId,
            weekStartDate: currentWeekStart,
          },
        },
      },
      completed: true,
    },
  });

  const skippedCount = await prisma.set.count({
    where: {
      workoutBlockExercise: {
        workoutBlock: {
          workoutDay: {
            athleteId,
            weekStartDate: currentWeekStart,
          },
        },
      },
      skipped: true,
    },
  });

  return {
    weeklyCompletion: {
      completed: completedCount,
      skipped: skippedCount,
      total: weeklyStats._count.id,
    },
    adherence: {
      range: adherenceRange,
      avgWeightDiff: null,
      avgRepsDiff: null,
    },
    personalRecords: [],
  };
});
```

### Step 4: Run test to verify it passes

Run: `bun test src/lib/stats/__tests__/getAthleteStats.test.ts`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/stats/
git commit -m "feat(stats): add getAthleteStats with weekly completion"
```

---

## Task 2: Add Adherence Calculation

**Files:**
- Modify: `src/lib/stats/getAthleteStats.ts`
- Modify: `src/lib/stats/__tests__/getAthleteStats.test.ts`

### Step 1: Write the failing test for adherence

Add to the test file:

```typescript
  describe("adherence", () => {
    test("calculates average weight and reps difference for week", async () => {
      const trainer = await userFactory.create({ role: UserRole.trainer });
      const athlete = await userFactory.create({ role: UserRole.athlete });
      const exercise = await exerciseFactory.create();

      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      monday.setHours(0, 0, 0, 0);

      const workoutDay = await workoutDayFactory.create({
        trainer: { connect: { id: trainer.id } },
        athlete: { connect: { id: athlete.id } },
        weekStartDate: monday,
        weekNumber: 1,
        dayIndex: 1,
      });

      const block = await workoutBlockFactory.create({
        workoutDay: { connect: { id: workoutDay.id } },
        order: 1,
      });

      const workoutExercise = await workoutBlockExerciseFactory.create({
        exercise: { connect: { id: exercise.id } },
        workoutBlock: { connect: { id: block.id } },
        order: 1,
      });

      // Set 1: prescribed 60kg x 8, actual 62kg x 8 (+2kg, 0 reps)
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 1,
        weightKg: 60,
        reps: 8,
        actualWeightKg: 62,
        actualReps: 8,
        completed: true,
      });

      // Set 2: prescribed 60kg x 8, actual 64kg x 7 (+4kg, -1 rep)
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 2,
        weightKg: 60,
        reps: 8,
        actualWeightKg: 64,
        actualReps: 7,
        completed: true,
      });

      // Skipped set should not count
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 3,
        weightKg: 60,
        reps: 8,
        skipped: true,
      });

      const result = await getAthleteStats(athlete.id, "week");

      // Average: (+2 + +4) / 2 = +3kg, (0 + -1) / 2 = -0.5 reps
      expect(result.adherence.range).toBe("week");
      expect(result.adherence.avgWeightDiff).toBe(3);
      expect(result.adherence.avgRepsDiff).toBe(-0.5);
    });

    test("returns null when no completed sets with actual values", async () => {
      const athlete = await userFactory.create({ role: UserRole.athlete });

      const result = await getAthleteStats(athlete.id, "week");

      expect(result.adherence.avgWeightDiff).toBeNull();
      expect(result.adherence.avgRepsDiff).toBeNull();
    });
  });
```

### Step 2: Run test to verify it fails

Run: `bun test src/lib/stats/__tests__/getAthleteStats.test.ts`
Expected: FAIL - avgWeightDiff is null

### Step 3: Implement adherence calculation

Update `getAthleteStats.ts` - add before the return statement:

```typescript
  // Adherence calculation
  const adherenceStartDate = adherenceRange === "week" ? currentWeekStart : getMonthAgo();

  const setsWithActuals = await prisma.set.findMany({
    where: {
      workoutBlockExercise: {
        workoutBlock: {
          workoutDay: {
            athleteId,
            weekStartDate: { gte: adherenceStartDate },
          },
        },
      },
      completed: true,
      skipped: false,
      actualWeightKg: { not: null },
      actualReps: { not: null },
      weightKg: { not: null },
      reps: { not: null },
    },
    select: {
      weightKg: true,
      reps: true,
      actualWeightKg: true,
      actualReps: true,
    },
  });

  let avgWeightDiff: number | null = null;
  let avgRepsDiff: number | null = null;

  if (setsWithActuals.length > 0) {
    const totalWeightDiff = setsWithActuals.reduce(
      (sum, s) => sum + (s.actualWeightKg! - s.weightKg!),
      0
    );
    const totalRepsDiff = setsWithActuals.reduce(
      (sum, s) => sum + (s.actualReps! - s.reps!),
      0
    );
    avgWeightDiff = totalWeightDiff / setsWithActuals.length;
    avgRepsDiff = totalRepsDiff / setsWithActuals.length;
  }
```

Update the return statement:

```typescript
  return {
    weeklyCompletion: {
      completed: completedCount,
      skipped: skippedCount,
      total: weeklyStats._count.id,
    },
    adherence: {
      range: adherenceRange,
      avgWeightDiff,
      avgRepsDiff,
    },
    personalRecords: [],
  };
```

### Step 4: Run test to verify it passes

Run: `bun test src/lib/stats/__tests__/getAthleteStats.test.ts`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/stats/
git commit -m "feat(stats): add adherence calculation"
```

---

## Task 3: Add Personal Records

**Files:**
- Modify: `src/lib/stats/getAthleteStats.ts`
- Modify: `src/lib/stats/__tests__/getAthleteStats.test.ts`

### Step 1: Write the failing test for PRs

Add to the test file:

```typescript
  describe("personalRecords", () => {
    test("returns top 5 exercises by max weight", async () => {
      const trainer = await userFactory.create({ role: UserRole.trainer });
      const athlete = await userFactory.create({ role: UserRole.athlete });

      const exercises = await Promise.all([
        exerciseFactory.create({ name: "Deadlift" }),
        exerciseFactory.create({ name: "Squat" }),
        exerciseFactory.create({ name: "Bench" }),
        exerciseFactory.create({ name: "Row" }),
        exerciseFactory.create({ name: "Press" }),
        exerciseFactory.create({ name: "Curl" }), // 6th - should not appear
      ]);

      const workoutDay = await workoutDayFactory.create({
        trainer: { connect: { id: trainer.id } },
        athlete: { connect: { id: athlete.id } },
        weekStartDate: new Date(),
        weekNumber: 1,
        dayIndex: 1,
      });

      const block = await workoutBlockFactory.create({
        workoutDay: { connect: { id: workoutDay.id } },
        order: 1,
      });

      // Create sets with different max weights
      const weights = [100, 80, 70, 60, 50, 40]; // Curl at 40 should be excluded
      for (let i = 0; i < exercises.length; i++) {
        const workoutExercise = await workoutBlockExerciseFactory.create({
          exercise: { connect: { id: exercises[i]!.id } },
          workoutBlock: { connect: { id: block.id } },
          order: i + 1,
        });

        await setFactory.create({
          workoutBlockExercise: { connect: { id: workoutExercise.id } },
          setIndex: 1,
          actualWeightKg: weights[i],
          completed: true,
        });
      }

      const result = await getAthleteStats(athlete.id, "week");

      expect(result.personalRecords).toHaveLength(5);
      expect(result.personalRecords[0]?.exerciseName).toBe("Deadlift");
      expect(result.personalRecords[0]?.weightKg).toBe(100);
      expect(result.personalRecords[4]?.exerciseName).toBe("Press");
      expect(result.personalRecords[4]?.weightKg).toBe(50);
    });

    test("only counts completed sets", async () => {
      const trainer = await userFactory.create({ role: UserRole.trainer });
      const athlete = await userFactory.create({ role: UserRole.athlete });
      const exercise = await exerciseFactory.create({ name: "Deadlift" });

      const workoutDay = await workoutDayFactory.create({
        trainer: { connect: { id: trainer.id } },
        athlete: { connect: { id: athlete.id } },
        weekStartDate: new Date(),
        weekNumber: 1,
        dayIndex: 1,
      });

      const block = await workoutBlockFactory.create({
        workoutDay: { connect: { id: workoutDay.id } },
        order: 1,
      });

      const workoutExercise = await workoutBlockExerciseFactory.create({
        exercise: { connect: { id: exercise.id } },
        workoutBlock: { connect: { id: block.id } },
        order: 1,
      });

      // Skipped set with higher weight should not count
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 1,
        actualWeightKg: 200,
        skipped: true,
      });

      // Completed set with lower weight
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 2,
        actualWeightKg: 100,
        completed: true,
      });

      const result = await getAthleteStats(athlete.id, "week");

      expect(result.personalRecords).toHaveLength(1);
      expect(result.personalRecords[0]?.weightKg).toBe(100);
    });
  });
```

### Step 2: Run test to verify it fails

Run: `bun test src/lib/stats/__tests__/getAthleteStats.test.ts`
Expected: FAIL - personalRecords is empty

### Step 3: Implement personal records

Add before the return statement in `getAthleteStats.ts`:

```typescript
  // Personal records - top 5 by max weight
  const allCompletedSets = await prisma.set.findMany({
    where: {
      workoutBlockExercise: {
        workoutBlock: {
          workoutDay: {
            athleteId,
          },
        },
      },
      completed: true,
      skipped: false,
      actualWeightKg: { not: null },
    },
    select: {
      actualWeightKg: true,
      completedAt: true,
      workoutBlockExercise: {
        select: {
          exercise: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Group by exercise and find max
  const prMap = new Map<string, { exerciseName: string; weightKg: number; achievedAt: Date }>();

  for (const set of allCompletedSets) {
    const exerciseId = set.workoutBlockExercise.exercise.id;
    const exerciseName = set.workoutBlockExercise.exercise.name;
    const weightKg = set.actualWeightKg!;
    const achievedAt = set.completedAt ?? new Date();

    const existing = prMap.get(exerciseId);
    if (!existing || weightKg > existing.weightKg) {
      prMap.set(exerciseId, { exerciseName, weightKg, achievedAt });
    }
  }

  const personalRecords = Array.from(prMap.values())
    .sort((a, b) => b.weightKg - a.weightKg)
    .slice(0, 5);
```

Update return to include `personalRecords`.

### Step 4: Run test to verify it passes

Run: `bun test src/lib/stats/__tests__/getAthleteStats.test.ts`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/stats/
git commit -m "feat(stats): add personal records"
```

---

## Task 4: Create Stats Page

**Files:**
- Create: `src/app/stats/page.tsx`

### Step 1: Create the page component

```typescript
// src/app/stats/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import getUser from "@/lib/auth/getUser";
import { getAthleteStats } from "@/lib/stats/getAthleteStats";
import WeeklyCompletionCard from "@/components/stats/WeeklyCompletionCard";
import AdherenceCard from "@/components/stats/AdherenceCard";
import PersonalRecordsCard from "@/components/stats/PersonalRecordsCard";

type StatsPageProps = {
  searchParams: Promise<{ range?: string }>;
};

export default async function StatsPage({ searchParams }: StatsPageProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { range } = await searchParams;
  const adherenceRange = range === "month" ? "month" : "week";

  const stats = await getAthleteStats(user.id, adherenceRange);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Volver"
          >
            <svg
              className="h-6 w-6 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">Estadísticas</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <WeeklyCompletionCard
          completed={stats.weeklyCompletion.completed}
          skipped={stats.weeklyCompletion.skipped}
          total={stats.weeklyCompletion.total}
        />

        <AdherenceCard
          range={stats.adherence.range}
          avgWeightDiff={stats.adherence.avgWeightDiff}
          avgRepsDiff={stats.adherence.avgRepsDiff}
        />

        <PersonalRecordsCard records={stats.personalRecords} />
      </div>
    </main>
  );
}
```

### Step 2: Verify page renders (manual check - components don't exist yet)

Run: `bun run dev`
Expected: TypeScript errors for missing components (expected at this step)

### Step 3: Commit page structure

```bash
git add src/app/stats/
git commit -m "feat(stats): add stats page structure"
```

---

## Task 5: Create WeeklyCompletionCard Component

**Files:**
- Create: `src/components/stats/WeeklyCompletionCard.tsx`

### Step 1: Create the component

```typescript
// src/components/stats/WeeklyCompletionCard.tsx
type WeeklyCompletionCardProps = {
  completed: number;
  skipped: number;
  total: number;
};

export default function WeeklyCompletionCard({
  completed,
  skipped,
  total,
}: WeeklyCompletionCardProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-500">Esta semana</h2>
        <span className="text-2xl font-bold text-slate-900">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm text-slate-600">
        {completed}/{total} completados
        {skipped > 0 && (
          <span className="text-slate-400"> ({skipped} salteados)</span>
        )}
      </p>
    </div>
  );
}
```

### Step 2: Commit

```bash
git add src/components/stats/
git commit -m "feat(stats): add WeeklyCompletionCard component"
```

---

## Task 6: Create AdherenceCard Component

**Files:**
- Create: `src/components/stats/AdherenceCard.tsx`

### Step 1: Create the component

```typescript
// src/components/stats/AdherenceCard.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

type AdherenceCardProps = {
  range: "week" | "month";
  avgWeightDiff: number | null;
  avgRepsDiff: number | null;
};

export default function AdherenceCard({
  range,
  avgWeightDiff,
  avgRepsDiff,
}: AdherenceCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleRange = () => {
    const newRange = range === "week" ? "month" : "week";
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    router.push(`/stats?${params.toString()}`);
  };

  const formatDiff = (value: number | null, unit: string) => {
    if (value === null) return "—";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}${unit}`;
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-500">Adherencia</h2>
        <button
          onClick={toggleRange}
          className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors"
        >
          {range === "week" ? "Esta semana" : "Último mes"}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Peso</span>
          <span
            className={`text-sm font-semibold ${
              avgWeightDiff === null
                ? "text-slate-400"
                : avgWeightDiff >= 0
                  ? "text-emerald-600"
                  : "text-amber-600"
            }`}
          >
            {formatDiff(avgWeightDiff, "kg promedio")}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Reps</span>
          <span
            className={`text-sm font-semibold ${
              avgRepsDiff === null
                ? "text-slate-400"
                : avgRepsDiff >= 0
                  ? "text-emerald-600"
                  : "text-amber-600"
            }`}
          >
            {formatDiff(avgRepsDiff, " promedio")}
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Commit

```bash
git add src/components/stats/
git commit -m "feat(stats): add AdherenceCard component"
```

---

## Task 7: Create PersonalRecordsCard Component

**Files:**
- Create: `src/components/stats/PersonalRecordsCard.tsx`

### Step 1: Create the component

```typescript
// src/components/stats/PersonalRecordsCard.tsx
type PersonalRecord = {
  exerciseName: string;
  weightKg: number;
  achievedAt: Date;
};

type PersonalRecordsCardProps = {
  records: PersonalRecord[];
};

export default function PersonalRecordsCard({
  records,
}: PersonalRecordsCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <h2 className="text-sm font-medium text-slate-500 mb-4">
        Records personales
      </h2>

      {records.length === 0 ? (
        <p className="text-sm text-slate-400">
          Completá sets para ver tus records
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((record, index) => (
            <div
              key={record.exerciseName}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                  {index + 1}
                </span>
                <span className="text-sm text-slate-700">
                  {record.exerciseName}
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {record.weightKg}kg
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 2: Commit

```bash
git add src/components/stats/
git commit -m "feat(stats): add PersonalRecordsCard component"
```

---

## Task 8: Add Stats Link to UserMenu

**Files:**
- Modify: `src/components/ui/UserMenu.tsx`

### Step 1: Update UserMenu to include stats link

Replace the menu content section:

```typescript
// In UserMenu.tsx, update the menu dropdown section (lines 57-74)
// Add Link import at top:
import Link from "next/link";

// Replace the dropdown content:
{isOpen && (
  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
    <div className="p-4 border-b border-slate-100">
      <p className="text-sm font-medium text-slate-900">{displayName}</p>
      <p className="text-xs text-slate-500 truncate">{userEmail}</p>
    </div>
    <div className="p-2">
      <Link
        href="/stats"
        className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        onClick={() => setIsOpen(false)}
      >
        Estadísticas
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  </div>
)}
```

### Step 2: Test manually

Run: `bun run dev`
Navigate to workout, click avatar, verify "Estadísticas" link appears and navigates to `/stats`

### Step 3: Commit

```bash
git add src/components/ui/UserMenu.tsx
git commit -m "feat(stats): add stats link to user menu"
```

---

## Task 9: Final Verification

### Step 1: Run all tests

Run: `bun test`
Expected: All tests pass

### Step 2: Manual E2E check

1. Log in as athlete
2. Complete a few sets with actual values
3. Click avatar → Estadísticas
4. Verify all three cards show data
5. Toggle adherence between week/month
6. Navigate back

### Step 3: Final commit with any fixes

```bash
git add .
git commit -m "feat(stats): complete athlete stats dashboard"
```
