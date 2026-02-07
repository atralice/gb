# Trainer Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a trainer dashboard for managing athletes' workout plans with inline editing, week copying, and a shared week table component.

**Architecture:** Server components for pages, shared WeekTable component with edit/readonly modes, server actions for mutations. Role-based routing with trainer routes under `/trainer/` and athlete week view at `/week`.

**Tech Stack:** Next.js App Router, Prisma, Tailwind CSS, bun:test, React Server Components, Server Actions

---

## Phase 1: Athletes List + Read-only Week View

### Task 1: Create getTrainerAthletes Query

**Files:**
- Create: `src/lib/trainer/getTrainerAthletes.ts`
- Test: `src/lib/trainer/__tests__/getTrainerAthletes.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/trainer/__tests__/getTrainerAthletes.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { getTrainerAthletes } from "../getTrainerAthletes";
import userFactory from "test/helpers/factories/userFactory";
import trainerAthleteFactory from "test/helpers/factories/trainerAthleteFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getTrainerAthletes", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns athletes linked to trainer", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete1 = await userFactory.create({
      role: UserRole.athlete,
      name: "Toni",
    });
    const athlete2 = await userFactory.create({
      role: UserRole.athlete,
      name: "Amani",
    });
    const otherAthlete = await userFactory.create({
      role: UserRole.athlete,
      name: "Other",
    });

    await trainerAthleteFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete1.id } },
    });
    await trainerAthleteFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete2.id } },
    });

    const result = await getTrainerAthletes(trainer.id);

    expect(result).toHaveLength(2);
    expect(result.map((a) => a.name).sort()).toEqual(["Amani", "Toni"]);
    expect(result.find((a) => a.name === "Other")).toBeUndefined();
  });

  test("returns empty array when trainer has no athletes", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });

    const result = await getTrainerAthletes(trainer.id);

    expect(result).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/getTrainerAthletes.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// src/lib/trainer/getTrainerAthletes.ts
import { cache } from "react";
import prisma from "../prisma";

export type TrainerAthlete = {
  id: string;
  name: string;
  email: string;
  lastActivity: Date | null;
  weeklyCompletion: { completed: number; total: number };
  needsAttention: boolean;
  attentionReason: "inactive" | "no_next_week" | null;
};

export const getTrainerAthletes = cache(async function getTrainerAthletes(
  trainerId: string
): Promise<TrainerAthlete[]> {
  const relationships = await prisma.trainerAthlete.findMany({
    where: { trainerId },
    include: {
      athlete: true,
    },
  });

  return relationships.map((rel) => ({
    id: rel.athlete.id,
    name: rel.athlete.name ?? rel.athlete.email.split("@")[0] ?? "Unknown",
    email: rel.athlete.email,
    lastActivity: null,
    weeklyCompletion: { completed: 0, total: 0 },
    needsAttention: false,
    attentionReason: null,
  }));
});
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/getTrainerAthletes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/
git commit -m "feat(trainer): add getTrainerAthletes query"
```

---

### Task 2: Add Weekly Completion to getTrainerAthletes

**Files:**
- Modify: `src/lib/trainer/getTrainerAthletes.ts`
- Modify: `src/lib/trainer/__tests__/getTrainerAthletes.test.ts`

**Step 1: Write the failing test**

Add to test file:

```typescript
  test("calculates weekly completion for current week", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    await trainerAthleteFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
    });

    // Current week
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

    // 3 completed, 1 pending = 4 total
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
      completed: false,
    });

    const result = await getTrainerAthletes(trainer.id);

    expect(result[0]?.weeklyCompletion).toEqual({
      completed: 3,
      total: 4,
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/getTrainerAthletes.test.ts`
Expected: FAIL - weeklyCompletion is { completed: 0, total: 0 }

**Step 3: Implement weekly completion calculation**

Update `getTrainerAthletes.ts`:

```typescript
// src/lib/trainer/getTrainerAthletes.ts
import { cache } from "react";
import prisma from "../prisma";

export type TrainerAthlete = {
  id: string;
  name: string;
  email: string;
  lastActivity: Date | null;
  weeklyCompletion: { completed: number; total: number };
  needsAttention: boolean;
  attentionReason: "inactive" | "no_next_week" | null;
};

function getCurrentWeekStart(): Date {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export const getTrainerAthletes = cache(async function getTrainerAthletes(
  trainerId: string
): Promise<TrainerAthlete[]> {
  const currentWeekStart = getCurrentWeekStart();

  const relationships = await prisma.trainerAthlete.findMany({
    where: { trainerId },
    include: {
      athlete: {
        include: {
          athleteWorkoutDays: {
            where: {
              weekStartDate: currentWeekStart,
            },
            include: {
              blocks: {
                include: {
                  exercises: {
                    include: {
                      sets: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return relationships.map((rel) => {
    const allSets = rel.athlete.athleteWorkoutDays.flatMap((day) =>
      day.blocks.flatMap((block) =>
        block.exercises.flatMap((ex) => ex.sets)
      )
    );

    const completed = allSets.filter((s) => s.completed).length;
    const total = allSets.length;

    return {
      id: rel.athlete.id,
      name: rel.athlete.name ?? rel.athlete.email.split("@")[0] ?? "Unknown",
      email: rel.athlete.email,
      lastActivity: null,
      weeklyCompletion: { completed, total },
      needsAttention: false,
      attentionReason: null,
    };
  });
});
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/getTrainerAthletes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/
git commit -m "feat(trainer): add weekly completion to getTrainerAthletes"
```

---

### Task 3: Add Last Activity and Needs Attention

**Files:**
- Modify: `src/lib/trainer/getTrainerAthletes.ts`
- Modify: `src/lib/trainer/__tests__/getTrainerAthletes.test.ts`

**Step 1: Write the failing tests**

Add to test file:

```typescript
  test("calculates last activity from most recent completed set", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    await trainerAthleteFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
    });

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

    const completedAt = new Date("2026-02-05T10:00:00Z");
    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      completed: true,
      completedAt,
    });

    const result = await getTrainerAthletes(trainer.id);

    expect(result[0]?.lastActivity).toEqual(completedAt);
  });

  test("flags athlete as needing attention when inactive 4+ days", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    await trainerAthleteFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
    });

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

    // Last activity 5 days ago
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      completed: true,
      completedAt: fiveDaysAgo,
    });

    const result = await getTrainerAthletes(trainer.id);

    expect(result[0]?.needsAttention).toBe(true);
    expect(result[0]?.attentionReason).toBe("inactive");
  });

  test("flags athlete when current week done but next week missing", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    await trainerAthleteFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
    });

    // Current week
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: monday,
      weekNumber: 5,
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

    // All sets completed (week is done)
    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      completed: true,
      completedAt: new Date(),
    });

    // No week 6 exists

    const result = await getTrainerAthletes(trainer.id);

    expect(result[0]?.needsAttention).toBe(true);
    expect(result[0]?.attentionReason).toBe("no_next_week");
  });
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/getTrainerAthletes.test.ts`
Expected: FAIL

**Step 3: Implement last activity and needs attention**

Update `getTrainerAthletes.ts`:

```typescript
// src/lib/trainer/getTrainerAthletes.ts
import { cache } from "react";
import prisma from "../prisma";

export type TrainerAthlete = {
  id: string;
  name: string;
  email: string;
  lastActivity: Date | null;
  weeklyCompletion: { completed: number; total: number };
  needsAttention: boolean;
  attentionReason: "inactive" | "no_next_week" | null;
};

function getCurrentWeekStart(): Date {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getNextWeekStart(): Date {
  const current = getCurrentWeekStart();
  current.setDate(current.getDate() + 7);
  return current;
}

const INACTIVE_DAYS_THRESHOLD = 4;

export const getTrainerAthletes = cache(async function getTrainerAthletes(
  trainerId: string
): Promise<TrainerAthlete[]> {
  const currentWeekStart = getCurrentWeekStart();
  const nextWeekStart = getNextWeekStart();

  const relationships = await prisma.trainerAthlete.findMany({
    where: { trainerId },
    include: {
      athlete: {
        include: {
          athleteWorkoutDays: {
            include: {
              blocks: {
                include: {
                  exercises: {
                    include: {
                      sets: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return relationships.map((rel) => {
    const allDays = rel.athlete.athleteWorkoutDays;
    const currentWeekDays = allDays.filter(
      (d) => d.weekStartDate.getTime() === currentWeekStart.getTime()
    );
    const nextWeekDays = allDays.filter(
      (d) => d.weekStartDate.getTime() === nextWeekStart.getTime()
    );

    // Current week sets
    const currentWeekSets = currentWeekDays.flatMap((day) =>
      day.blocks.flatMap((block) =>
        block.exercises.flatMap((ex) => ex.sets)
      )
    );
    const completed = currentWeekSets.filter((s) => s.completed).length;
    const total = currentWeekSets.length;

    // All sets for last activity
    const allSets = allDays.flatMap((day) =>
      day.blocks.flatMap((block) =>
        block.exercises.flatMap((ex) => ex.sets)
      )
    );

    // Find most recent completedAt
    const completedSets = allSets.filter((s) => s.completedAt !== null);
    const lastActivity = completedSets.length > 0
      ? completedSets.reduce((latest, s) =>
          s.completedAt! > latest ? s.completedAt! : latest,
          completedSets[0]!.completedAt!
        )
      : null;

    // Check needs attention
    let needsAttention = false;
    let attentionReason: "inactive" | "no_next_week" | null = null;

    // Inactive check
    if (lastActivity) {
      const daysSinceActivity = Math.floor(
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceActivity >= INACTIVE_DAYS_THRESHOLD) {
        needsAttention = true;
        attentionReason = "inactive";
      }
    }

    // No next week check (only if current week is complete and not already flagged)
    if (!needsAttention && total > 0 && completed === total) {
      if (nextWeekDays.length === 0) {
        needsAttention = true;
        attentionReason = "no_next_week";
      }
    }

    return {
      id: rel.athlete.id,
      name: rel.athlete.name ?? rel.athlete.email.split("@")[0] ?? "Unknown",
      email: rel.athlete.email,
      lastActivity,
      weeklyCompletion: { completed, total },
      needsAttention,
      attentionReason,
    };
  });
});
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/getTrainerAthletes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/
git commit -m "feat(trainer): add last activity and needs attention flags"
```

---

### Task 4: Create Athletes List Page

**Files:**
- Create: `src/app/trainer/athletes/page.tsx`
- Create: `src/components/trainer/AthletesTable.tsx`

**Step 1: Create the page component**

```typescript
// src/app/trainer/athletes/page.tsx
import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getTrainerAthletes } from "@/lib/trainer/getTrainerAthletes";
import AthletesTable from "@/components/trainer/AthletesTable";

export default async function TrainerAthletesPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "trainer") {
    redirect("/");
  }

  const athletes = await getTrainerAthletes(user.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">Mis atletas</h1>
      </header>

      <div className="p-4">
        <AthletesTable athletes={athletes} />
      </div>
    </main>
  );
}
```

**Step 2: Create the table component**

```typescript
// src/components/trainer/AthletesTable.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { TrainerAthlete } from "@/lib/trainer/getTrainerAthletes";

type AthletesTableProps = {
  athletes: TrainerAthlete[];
};

export default function AthletesTable({ athletes }: AthletesTableProps) {
  const [search, setSearch] = useState("");

  const filtered = athletes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (athletes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No tenés atletas asignados</p>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar atleta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                Nombre
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                Última actividad
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                Completado
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((athlete) => (
              <tr
                key={athlete.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/trainer/athletes/${athlete.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-slate-600"
                  >
                    {athlete.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {athlete.lastActivity
                    ? formatDistanceToNow(athlete.lastActivity, {
                        addSuffix: true,
                        locale: es,
                      })
                    : "Sin actividad"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {athlete.weeklyCompletion.total > 0 ? (
                    <>
                      {Math.round(
                        (athlete.weeklyCompletion.completed /
                          athlete.weeklyCompletion.total) *
                          100
                      )}
                      %{" "}
                      <span className="text-slate-400">
                        ({athlete.weeklyCompletion.completed}/
                        {athlete.weeklyCompletion.total})
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {athlete.needsAttention ? (
                    <span
                      className="text-amber-500"
                      title={
                        athlete.attentionReason === "inactive"
                          ? "Sin actividad reciente"
                          : "Necesita nueva semana"
                      }
                    >
                      ⚠️
                    </span>
                  ) : (
                    <span className="text-emerald-500">✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 3: Test manually**

Run: `bun run dev`
Log in as trainer, navigate to `/trainer/athletes`
Expected: See athletes list with search, columns, status indicators

**Step 4: Commit**

```bash
git add src/app/trainer/ src/components/trainer/
git commit -m "feat(trainer): add athletes list page"
```

---

### Task 5: Create getAthleteWeek Query

**Files:**
- Create: `src/lib/trainer/getAthleteWeek.ts`
- Test: `src/lib/trainer/__tests__/getAthleteWeek.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/trainer/__tests__/getAthleteWeek.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { getAthleteWeek } from "../getAthleteWeek";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getAthleteWeek", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns week data with days, exercises, and sets", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({
      role: UserRole.athlete,
      name: "Toni",
    });
    const exercise = await exerciseFactory.create({ name: "Peso muerto" });

    const weekStartDate = new Date("2026-02-02");

    const day1 = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate,
      weekNumber: 5,
      dayIndex: 1,
      label: "Día 1",
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day1.id } },
      order: 1,
      label: "A",
    });

    const workoutExercise = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 60,
      actualReps: 5,
      actualWeightKg: 62,
      completed: true,
    });

    const result = await getAthleteWeek(athlete.id, 5);

    expect(result).not.toBeNull();
    expect(result?.athlete.name).toBe("Toni");
    expect(result?.weekNumber).toBe(5);
    expect(result?.days).toHaveLength(1);
    expect(result?.days[0]?.dayIndex).toBe(1);
    expect(result?.days[0]?.exercises).toHaveLength(1);
    expect(result?.days[0]?.exercises[0]?.exerciseName).toBe("Peso muerto");
    expect(result?.days[0]?.exercises[0]?.sets).toHaveLength(1);
    expect(result?.days[0]?.exercises[0]?.sets[0]).toMatchObject({
      reps: 5,
      weightKg: 60,
      actualReps: 5,
      actualWeightKg: 62,
    });
  });

  test("returns null when week not found", async () => {
    const athlete = await userFactory.create({ role: UserRole.athlete });

    const result = await getAthleteWeek(athlete.id, 999);

    expect(result).toBeNull();
  });

  test("includes previous and next week existence flags", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });

    // Create weeks 4, 5, 6
    for (const weekNum of [4, 5, 6]) {
      await workoutDayFactory.create({
        trainer: { connect: { id: trainer.id } },
        athlete: { connect: { id: athlete.id } },
        weekStartDate: new Date(`2026-01-${weekNum * 7}`),
        weekNumber: weekNum,
        dayIndex: 1,
      });
    }

    const result = await getAthleteWeek(athlete.id, 5);

    expect(result?.previousWeekExists).toBe(true);
    expect(result?.nextWeekExists).toBe(true);

    const resultFirst = await getAthleteWeek(athlete.id, 4);
    expect(resultFirst?.previousWeekExists).toBe(false);

    const resultLast = await getAthleteWeek(athlete.id, 6);
    expect(resultLast?.nextWeekExists).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/getAthleteWeek.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/lib/trainer/getAthleteWeek.ts
import { cache } from "react";
import prisma from "../prisma";

export type AthleteWeekSet = {
  id: string;
  setIndex: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
  actualReps: number | null;
  actualWeightKg: number | null;
  completed: boolean;
  skipped: boolean;
  lastWeekActual: { reps: number; weightKg: number } | null;
};

export type AthleteWeekExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: AthleteWeekSet[];
};

export type AthleteWeekDay = {
  id: string;
  dayIndex: number;
  label: string | null;
  exercises: AthleteWeekExercise[];
};

export type AthleteWeekData = {
  athlete: { id: string; name: string };
  weekNumber: number;
  weekStartDate: Date;
  previousWeekExists: boolean;
  nextWeekExists: boolean;
  days: AthleteWeekDay[];
};

export const getAthleteWeek = cache(async function getAthleteWeek(
  athleteId: string,
  weekNumber: number
): Promise<AthleteWeekData | null> {
  const athlete = await prisma.user.findUnique({
    where: { id: athleteId },
    select: { id: true, name: true, email: true },
  });

  if (!athlete) return null;

  const workoutDays = await prisma.workoutDay.findMany({
    where: { athleteId, weekNumber },
    include: {
      blocks: {
        include: {
          exercises: {
            include: {
              exercise: true,
              sets: {
                orderBy: { setIndex: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { dayIndex: "asc" },
  });

  if (workoutDays.length === 0) return null;

  // Check previous/next week existence
  const [prevWeek, nextWeek] = await Promise.all([
    prisma.workoutDay.findFirst({
      where: { athleteId, weekNumber: weekNumber - 1 },
      select: { id: true },
    }),
    prisma.workoutDay.findFirst({
      where: { athleteId, weekNumber: weekNumber + 1 },
      select: { id: true },
    }),
  ]);

  // Get last week's data for comparison
  const lastWeekDays = await prisma.workoutDay.findMany({
    where: { athleteId, weekNumber: weekNumber - 1 },
    include: {
      blocks: {
        include: {
          exercises: {
            include: {
              sets: true,
            },
          },
        },
      },
    },
  });

  // Build map of exercise -> last week actuals
  const lastWeekActuals = new Map<string, { reps: number; weightKg: number }>();
  for (const day of lastWeekDays) {
    for (const block of day.blocks) {
      for (const ex of block.exercises) {
        for (const set of ex.sets) {
          if (set.actualReps !== null && set.actualWeightKg !== null) {
            const existing = lastWeekActuals.get(ex.exerciseId);
            if (!existing || set.actualWeightKg > existing.weightKg) {
              lastWeekActuals.set(ex.exerciseId, {
                reps: set.actualReps,
                weightKg: set.actualWeightKg,
              });
            }
          }
        }
      }
    }
  }

  const days: AthleteWeekDay[] = workoutDays.map((day) => ({
    id: day.id,
    dayIndex: day.dayIndex,
    label: day.label,
    exercises: day.blocks.flatMap((block) =>
      block.exercises.map((ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exercise.name,
        sets: ex.sets.map((set) => ({
          id: set.id,
          setIndex: set.setIndex,
          reps: set.reps,
          weightKg: set.weightKg,
          durationSeconds: set.durationSeconds,
          repsPerSide: set.repsPerSide,
          actualReps: set.actualReps,
          actualWeightKg: set.actualWeightKg,
          completed: set.completed,
          skipped: set.skipped,
          lastWeekActual: lastWeekActuals.get(ex.exerciseId) ?? null,
        })),
      }))
    ),
  }));

  return {
    athlete: {
      id: athlete.id,
      name: athlete.name ?? athlete.email.split("@")[0] ?? "Unknown",
    },
    weekNumber,
    weekStartDate: workoutDays[0]!.weekStartDate,
    previousWeekExists: prevWeek !== null,
    nextWeekExists: nextWeek !== null,
    days,
  };
});
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/getAthleteWeek.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/
git commit -m "feat(trainer): add getAthleteWeek query"
```

---

### Task 6: Create getLatestWeekNumber Query

**Files:**
- Create: `src/lib/trainer/getLatestWeekNumber.ts`
- Test: `src/lib/trainer/__tests__/getLatestWeekNumber.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/trainer/__tests__/getLatestWeekNumber.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { getLatestWeekNumber } from "../getLatestWeekNumber";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getLatestWeekNumber", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns highest week number for athlete", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 3,
      dayIndex: 1,
    });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 5,
      dayIndex: 1,
    });

    const result = await getLatestWeekNumber(athlete.id);

    expect(result).toBe(5);
  });

  test("returns null when athlete has no workouts", async () => {
    const athlete = await userFactory.create({ role: UserRole.athlete });

    const result = await getLatestWeekNumber(athlete.id);

    expect(result).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/getLatestWeekNumber.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/lib/trainer/getLatestWeekNumber.ts
import { cache } from "react";
import prisma from "../prisma";

export const getLatestWeekNumber = cache(async function getLatestWeekNumber(
  athleteId: string
): Promise<number | null> {
  const latest = await prisma.workoutDay.findFirst({
    where: { athleteId },
    orderBy: { weekNumber: "desc" },
    select: { weekNumber: true },
  });

  return latest?.weekNumber ?? null;
});
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/getLatestWeekNumber.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/
git commit -m "feat(trainer): add getLatestWeekNumber query"
```

---

### Task 7: Create WeekTable Component (Read-only)

**Files:**
- Create: `src/components/trainer/WeekTable.tsx`

**Step 1: Create the component**

```typescript
// src/components/trainer/WeekTable.tsx
"use client";

import type { AthleteWeekData } from "@/lib/trainer/getAthleteWeek";

type WeekTableProps = {
  data: AthleteWeekData;
  mode: "edit" | "readonly";
  onDayClick?: (dayIndex: number) => void;
};

export default function WeekTable({ data, mode, onDayClick }: WeekTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              Ejercicio
            </th>
            <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-16">
              Serie
            </th>
            <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-20">
              Reps
            </th>
            <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
              Peso (kg)
            </th>
            {mode === "edit" && (
              <>
                <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                  Actual
                </th>
                <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                  Últ. sem
                </th>
              </>
            )}
            {mode === "readonly" && (
              <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                Hecho
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.days.map((day) => (
            <>
              {/* Day header row */}
              <tr
                key={`day-${day.dayIndex}`}
                className={`bg-slate-100 border-y border-slate-200 ${
                  mode === "readonly" && onDayClick
                    ? "cursor-pointer hover:bg-slate-200"
                    : ""
                }`}
                onClick={() =>
                  mode === "readonly" && onDayClick?.(day.dayIndex)
                }
              >
                <td
                  colSpan={mode === "edit" ? 6 : 5}
                  className="px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span>DÍA {day.dayIndex}</span>
                    {mode === "readonly" && (
                      <span className="text-slate-500 text-xs">
                        {day.exercises.reduce(
                          (acc, ex) =>
                            acc + ex.sets.filter((s) => s.completed).length,
                          0
                        )}
                        /
                        {day.exercises.reduce(
                          (acc, ex) => acc + ex.sets.length,
                          0
                        )}{" "}
                        →
                      </span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Exercise rows */}
              {day.exercises.map((exercise, exIndex) =>
                exercise.sets.map((set, setIndex) => (
                  <tr
                    key={set.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-2 text-sm text-slate-700">
                      {setIndex === 0 ? exercise.exerciseName : ""}
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-slate-600">
                      {set.setIndex}
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-slate-600">
                      {set.reps ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-slate-600">
                      {set.weightKg ?? "—"}
                    </td>
                    {mode === "edit" && (
                      <>
                        <td className="px-3 py-2 text-center text-sm text-slate-500">
                          {set.actualWeightKg !== null &&
                          set.actualReps !== null
                            ? `${set.actualWeightKg}/${set.actualReps}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-center text-sm text-slate-400">
                          {set.lastWeekActual
                            ? `${set.lastWeekActual.weightKg}/${set.lastWeekActual.reps}`
                            : "—"}
                        </td>
                      </>
                    )}
                    {mode === "readonly" && (
                      <td className="px-3 py-2 text-center text-sm">
                        {set.completed ? (
                          <span className="text-emerald-600">
                            ✓{" "}
                            {set.actualWeightKg !== null
                              ? `${set.actualWeightKg}/${set.actualReps}`
                              : ""}
                          </span>
                        ) : set.skipped ? (
                          <span className="text-slate-400">Salteado</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/trainer/
git commit -m "feat(trainer): add WeekTable component"
```

---

### Task 8: Create Athlete Week Page

**Files:**
- Create: `src/app/trainer/athletes/[athleteId]/page.tsx`

**Step 1: Create the page**

```typescript
// src/app/trainer/athletes/[athleteId]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import { getLatestWeekNumber } from "@/lib/trainer/getLatestWeekNumber";
import WeekTable from "@/components/trainer/WeekTable";

type AthleteWeekPageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ week?: string }>;
};

export default async function AthleteWeekPage({
  params,
  searchParams,
}: AthleteWeekPageProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "trainer") {
    redirect("/");
  }

  const { athleteId } = await params;
  const { week } = await searchParams;

  // Get week number from URL or default to latest
  let weekNumber: number;
  if (week) {
    weekNumber = parseInt(week, 10);
    if (isNaN(weekNumber)) {
      notFound();
    }
  } else {
    const latest = await getLatestWeekNumber(athleteId);
    if (!latest) {
      return (
        <main className="min-h-screen bg-slate-50">
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/trainer/athletes"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
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
              <h1 className="text-lg font-semibold text-slate-900">
                Sin entrenamientos
              </h1>
            </div>
          </header>
          <div className="p-4 text-center text-slate-500">
            Este atleta no tiene entrenamientos programados.
          </div>
        </main>
      );
    }
    weekNumber = latest;
  }

  const weekData = await getAthleteWeek(athleteId, weekNumber);

  if (!weekData) {
    notFound();
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
            <h1 className="text-lg font-semibold text-slate-900">
              {weekData.athlete.name} - Semana {weekNumber}
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
              <Link
                href={`/trainer/athletes/${athleteId}?week=${weekNumber + 1}&create=true`}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Sem {weekNumber + 1} →
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="p-4">
        <WeekTable data={weekData} mode="edit" />
      </div>
    </main>
  );
}
```

**Step 2: Test manually**

Run: `bun run dev`
Log in as trainer, go to `/trainer/athletes`, click an athlete
Expected: See week table with days, exercises, sets

**Step 3: Commit**

```bash
git add src/app/trainer/
git commit -m "feat(trainer): add athlete week page"
```

---

### Task 9: Add Trainer Menu Link

**Files:**
- Modify: `src/components/ui/UserMenu.tsx`

**Step 1: Update UserMenu with role-based links**

```typescript
// src/components/ui/UserMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/lib/auth/actions/logout";

type UserMenuProps = {
  userName?: string | null;
  userEmail: string;
  userRole?: "athlete" | "trainer" | "admin";
};

export default function UserMenu({
  userName,
  userEmail,
  userRole = "athlete",
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (
        menuRef.current &&
        target instanceof Node &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const displayName = userName || userEmail.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 p-2 transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-medium text-slate-700">
          {initials}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
          <div className="p-4 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <div className="p-2">
            {userRole === "trainer" && (
              <Link
                href="/trainer/athletes"
                className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Mis atletas
              </Link>
            )}
            {userRole === "athlete" && (
              <Link
                href="/week"
                className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Ver semana
              </Link>
            )}
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
    </div>
  );
}
```

**Step 2: Update WorkoutViewer to pass userRole**

Find where UserMenu is used and pass the role. Check `src/components/workout/WorkoutViewer.tsx`.

**Step 3: Commit**

```bash
git add src/components/ui/UserMenu.tsx
git commit -m "feat(trainer): add role-based menu links"
```

---

## Phase 2: Inline Editing

### Task 10: Create updateSets Server Action

**Files:**
- Create: `src/lib/trainer/actions/updateSets.ts`
- Test: `src/lib/trainer/__tests__/updateSets.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/trainer/__tests__/updateSets.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { updateSets } from "../actions/updateSets";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("updateSets", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("updates reps and weightKg for multiple sets", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 5,
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

    const set1 = await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 60,
    });

    const set2 = await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 2,
      reps: 5,
      weightKg: 60,
    });

    await updateSets([
      { setId: set1.id, reps: 6, weightKg: 65 },
      { setId: set2.id, reps: 4, weightKg: 70 },
    ]);

    const updated1 = await prisma.set.findUnique({ where: { id: set1.id } });
    const updated2 = await prisma.set.findUnique({ where: { id: set2.id } });

    expect(updated1?.reps).toBe(6);
    expect(updated1?.weightKg).toBe(65);
    expect(updated2?.reps).toBe(4);
    expect(updated2?.weightKg).toBe(70);
  });

  test("allows partial updates", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 5,
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

    const set = await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 60,
    });

    // Only update weight
    await updateSets([{ setId: set.id, weightKg: 65 }]);

    const updated = await prisma.set.findUnique({ where: { id: set.id } });

    expect(updated?.reps).toBe(5); // unchanged
    expect(updated?.weightKg).toBe(65); // changed
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/updateSets.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/lib/trainer/actions/updateSets.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type SetUpdate = {
  setId: string;
  reps?: number;
  weightKg?: number;
};

export async function updateSets(updates: SetUpdate[]): Promise<void> {
  await prisma.$transaction(
    updates.map((update) =>
      prisma.set.update({
        where: { id: update.setId },
        data: {
          ...(update.reps !== undefined && { reps: update.reps }),
          ...(update.weightKg !== undefined && { weightKg: update.weightKg }),
        },
      })
    )
  );

  revalidatePath("/trainer/athletes");
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/updateSets.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/actions/
git commit -m "feat(trainer): add updateSets server action"
```

---

### Task 11: Add Inline Editing to WeekTable

**Files:**
- Modify: `src/components/trainer/WeekTable.tsx`

**Step 1: Update WeekTable with editable inputs**

```typescript
// src/components/trainer/WeekTable.tsx
"use client";

import { useState, useTransition } from "react";
import type { AthleteWeekData, AthleteWeekSet } from "@/lib/trainer/getAthleteWeek";
import { updateSets } from "@/lib/trainer/actions/updateSets";

type WeekTableProps = {
  data: AthleteWeekData;
  mode: "edit" | "readonly";
  onDayClick?: (dayIndex: number) => void;
};

type EditedSet = {
  setId: string;
  reps?: number;
  weightKg?: number;
};

export default function WeekTable({ data, mode, onDayClick }: WeekTableProps) {
  const [editedSets, setEditedSets] = useState<Map<string, EditedSet>>(
    new Map()
  );
  const [isPending, startTransition] = useTransition();

  const hasChanges = editedSets.size > 0;

  const handleInputChange = (
    setId: string,
    field: "reps" | "weightKg",
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseFloat(value);

    setEditedSets((prev) => {
      const next = new Map(prev);
      const existing = next.get(setId) ?? { setId };
      next.set(setId, { ...existing, [field]: numValue });
      return next;
    });
  };

  const getCurrentValue = (
    set: AthleteWeekSet,
    field: "reps" | "weightKg"
  ): string => {
    const edited = editedSets.get(set.id);
    if (edited && edited[field] !== undefined) {
      return String(edited[field]);
    }
    const original = set[field];
    return original !== null ? String(original) : "";
  };

  const handleSave = () => {
    const updates = Array.from(editedSets.values()).filter(
      (u) => u.reps !== undefined || u.weightKg !== undefined
    );

    if (updates.length === 0) return;

    startTransition(async () => {
      await updateSets(updates);
      setEditedSets(new Map());
    });
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                Ejercicio
              </th>
              <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-16">
                Serie
              </th>
              <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-20">
                Reps
              </th>
              <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                Peso (kg)
              </th>
              {mode === "edit" && (
                <>
                  <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                    Actual
                  </th>
                  <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                    Últ. sem
                  </th>
                </>
              )}
              {mode === "readonly" && (
                <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                  Hecho
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.days.map((day) => (
              <>
                <tr
                  key={`day-${day.dayIndex}`}
                  className={`bg-slate-100 border-y border-slate-200 ${
                    mode === "readonly" && onDayClick
                      ? "cursor-pointer hover:bg-slate-200"
                      : ""
                  }`}
                  onClick={() =>
                    mode === "readonly" && onDayClick?.(day.dayIndex)
                  }
                >
                  <td
                    colSpan={mode === "edit" ? 6 : 5}
                    className="px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span>DÍA {day.dayIndex}</span>
                      {mode === "readonly" && (
                        <span className="text-slate-500 text-xs">
                          {day.exercises.reduce(
                            (acc, ex) =>
                              acc + ex.sets.filter((s) => s.completed).length,
                            0
                          )}
                          /
                          {day.exercises.reduce(
                            (acc, ex) => acc + ex.sets.length,
                            0
                          )}{" "}
                          →
                        </span>
                      )}
                    </div>
                  </td>
                </tr>

                {day.exercises.map((exercise) =>
                  exercise.sets.map((set, setIndex) => (
                    <tr
                      key={set.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-2 text-sm text-slate-700">
                        {setIndex === 0 ? exercise.exerciseName : ""}
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-slate-600">
                        {set.setIndex}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {mode === "edit" ? (
                          <input
                            type="number"
                            value={getCurrentValue(set, "reps")}
                            onChange={(e) =>
                              handleInputChange(set.id, "reps", e.target.value)
                            }
                            className="w-16 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                        ) : (
                          <span className="text-sm text-slate-600">
                            {set.reps ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {mode === "edit" ? (
                          <input
                            type="number"
                            step="0.5"
                            value={getCurrentValue(set, "weightKg")}
                            onChange={(e) =>
                              handleInputChange(
                                set.id,
                                "weightKg",
                                e.target.value
                              )
                            }
                            className="w-20 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                        ) : (
                          <span className="text-sm text-slate-600">
                            {set.weightKg ?? "—"}
                          </span>
                        )}
                      </td>
                      {mode === "edit" && (
                        <>
                          <td className="px-3 py-2 text-center text-sm text-slate-500">
                            {set.actualWeightKg !== null &&
                            set.actualReps !== null
                              ? `${set.actualWeightKg}/${set.actualReps}`
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-center text-sm text-slate-400">
                            {set.lastWeekActual
                              ? `${set.lastWeekActual.weightKg}/${set.lastWeekActual.reps}`
                              : "—"}
                          </td>
                        </>
                      )}
                      {mode === "readonly" && (
                        <td className="px-3 py-2 text-center text-sm">
                          {set.completed ? (
                            <span className="text-emerald-600">
                              ✓{" "}
                              {set.actualWeightKg !== null
                                ? `${set.actualWeightKg}/${set.actualReps}`
                                : ""}
                            </span>
                          ) : set.skipped ? (
                            <span className="text-slate-400">Salteado</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {mode === "edit" && (
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
      )}
    </div>
  );
}
```

**Step 2: Test manually**

Run: `bun run dev`
Log in as trainer, edit some values, click save
Expected: Changes persist after page reload

**Step 3: Commit**

```bash
git add src/components/trainer/
git commit -m "feat(trainer): add inline editing to WeekTable"
```

---

## Phase 3: Copy Week

### Task 12: Create copyWeek Server Action

**Files:**
- Create: `src/lib/trainer/actions/copyWeek.ts`
- Test: `src/lib/trainer/__tests__/copyWeek.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/trainer/__tests__/copyWeek.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { copyWeek } from "../actions/copyWeek";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("copyWeek", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("copies week structure with all exercises and sets", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create({ name: "Peso muerto" });

    const sourceWeekStart = new Date("2026-02-02");

    const day1 = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: sourceWeekStart,
      weekNumber: 5,
      dayIndex: 1,
      label: "Día 1",
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day1.id } },
      order: 1,
      label: "A",
    });

    const workoutExercise = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 100,
      actualReps: 5,
      actualWeightKg: 102,
      completed: true,
    });

    const result = await copyWeek(athlete.id, trainer.id, 5, 6, false);

    expect(result.weekNumber).toBe(6);

    // Verify new week exists
    const newDays = await prisma.workoutDay.findMany({
      where: { athleteId: athlete.id, weekNumber: 6 },
      include: {
        blocks: {
          include: {
            exercises: {
              include: { sets: true },
            },
          },
        },
      },
    });

    expect(newDays).toHaveLength(1);
    expect(newDays[0]?.dayIndex).toBe(1);
    expect(newDays[0]?.blocks).toHaveLength(1);
    expect(newDays[0]?.blocks[0]?.exercises).toHaveLength(1);
    expect(newDays[0]?.blocks[0]?.exercises[0]?.sets).toHaveLength(1);

    // Verify prescribed values copied, actuals reset
    const newSet = newDays[0]?.blocks[0]?.exercises[0]?.sets[0];
    expect(newSet?.reps).toBe(5);
    expect(newSet?.weightKg).toBe(100);
    expect(newSet?.actualReps).toBeNull();
    expect(newSet?.actualWeightKg).toBeNull();
    expect(newSet?.completed).toBe(false);
  });

  test("creates empty week when empty=true", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    const day1 = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 5,
      dayIndex: 1,
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day1.id } },
      order: 1,
    });

    await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    const result = await copyWeek(athlete.id, trainer.id, 5, 6, true);

    expect(result.weekNumber).toBe(6);

    const newDays = await prisma.workoutDay.findMany({
      where: { athleteId: athlete.id, weekNumber: 6 },
      include: { blocks: true },
    });

    // Days created but no blocks
    expect(newDays).toHaveLength(1);
    expect(newDays[0]?.blocks).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/trainer/__tests__/copyWeek.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/lib/trainer/actions/copyWeek.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function copyWeek(
  athleteId: string,
  trainerId: string,
  sourceWeek: number,
  targetWeek: number,
  empty: boolean
): Promise<{ weekNumber: number }> {
  const sourceDays = await prisma.workoutDay.findMany({
    where: { athleteId, weekNumber: sourceWeek },
    include: {
      blocks: {
        include: {
          exercises: {
            include: { sets: true },
          },
          orderBy: { order: "asc" },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { dayIndex: "asc" },
  });

  if (sourceDays.length === 0) {
    throw new Error("Source week not found");
  }

  // Calculate new week start date (7 days after source)
  const sourceWeekStart = sourceDays[0]!.weekStartDate;
  const weeksDiff = targetWeek - sourceWeek;
  const targetWeekStart = new Date(sourceWeekStart);
  targetWeekStart.setDate(targetWeekStart.getDate() + weeksDiff * 7);

  // Create new days
  for (const sourceDay of sourceDays) {
    const newDay = await prisma.workoutDay.create({
      data: {
        trainerId,
        athleteId,
        weekNumber: targetWeek,
        weekStartDate: targetWeekStart,
        dayIndex: sourceDay.dayIndex,
        label: sourceDay.label,
        notes: sourceDay.notes,
      },
    });

    if (!empty) {
      // Copy blocks, exercises, and sets
      for (const sourceBlock of sourceDay.blocks) {
        const newBlock = await prisma.workoutBlock.create({
          data: {
            workoutDayId: newDay.id,
            order: sourceBlock.order,
            label: sourceBlock.label,
            comment: sourceBlock.comment,
          },
        });

        for (const sourceExercise of sourceBlock.exercises) {
          const newExercise = await prisma.workoutBlockExercise.create({
            data: {
              workoutBlockId: newBlock.id,
              exerciseId: sourceExercise.exerciseId,
              order: sourceExercise.order,
              comment: sourceExercise.comment,
              variants: sourceExercise.variants,
            },
          });

          for (const sourceSet of sourceExercise.sets) {
            await prisma.set.create({
              data: {
                workoutBlockExerciseId: newExercise.id,
                setIndex: sourceSet.setIndex,
                reps: sourceSet.reps,
                weightKg: sourceSet.weightKg,
                durationSeconds: sourceSet.durationSeconds,
                repsPerSide: sourceSet.repsPerSide,
                // Reset actuals
                actualReps: null,
                actualWeightKg: null,
                actualDurationSeconds: null,
                actualRpe: null,
                completed: false,
                skipped: false,
                logNotes: null,
                completedAt: null,
              },
            });
          }
        }
      }
    }
  }

  revalidatePath(`/trainer/athletes/${athleteId}`);

  return { weekNumber: targetWeek };
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/trainer/__tests__/copyWeek.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/trainer/actions/
git commit -m "feat(trainer): add copyWeek server action"
```

---

### Task 13: Create CreateWeekDialog Component

**Files:**
- Create: `src/components/trainer/CreateWeekDialog.tsx`

**Step 1: Create the component**

```typescript
// src/components/trainer/CreateWeekDialog.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { copyWeek } from "@/lib/trainer/actions/copyWeek";

type CreateWeekDialogProps = {
  open: boolean;
  onClose: () => void;
  athleteId: string;
  trainerId: string;
  sourceWeek: number;
  targetWeek: number;
};

export default function CreateWeekDialog({
  open,
  onClose,
  athleteId,
  trainerId,
  sourceWeek,
  targetWeek,
}: CreateWeekDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"copy" | "empty">("copy");
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const handleCreate = () => {
    startTransition(async () => {
      await copyWeek(athleteId, trainerId, sourceWeek, targetWeek, mode === "empty");
      router.push(`/trainer/athletes/${athleteId}?week=${targetWeek}`);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Crear semana {targetWeek}
        </h2>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="mode"
              checked={mode === "copy"}
              onChange={() => setMode("copy")}
              className="w-4 h-4 text-slate-800"
            />
            <span className="text-sm text-slate-700">
              Copiar semana {sourceWeek}
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="mode"
              checked={mode === "empty"}
              onChange={() => setMode("empty")}
              className="w-4 h-4 text-slate-800"
            />
            <span className="text-sm text-slate-700">Crear semana vacía</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {isPending ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/trainer/
git commit -m "feat(trainer): add CreateWeekDialog component"
```

---

### Task 14: Integrate CreateWeekDialog into Athlete Week Page

**Files:**
- Modify: `src/app/trainer/athletes/[athleteId]/page.tsx`

**Step 1: Update page to handle create=true param and show dialog**

The page needs to become a client component wrapper or use a client component for the dialog trigger. Update the page to include the dialog when `?create=true` is in URL.

```typescript
// src/app/trainer/athletes/[athleteId]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import { getLatestWeekNumber } from "@/lib/trainer/getLatestWeekNumber";
import WeekTable from "@/components/trainer/WeekTable";
import CreateWeekDialogTrigger from "@/components/trainer/CreateWeekDialogTrigger";

type AthleteWeekPageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ week?: string; create?: string }>;
};

export default async function AthleteWeekPage({
  params,
  searchParams,
}: AthleteWeekPageProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "trainer") {
    redirect("/");
  }

  const { athleteId } = await params;
  const { week, create } = await searchParams;

  // Get week number from URL or default to latest
  let weekNumber: number;
  const latest = await getLatestWeekNumber(athleteId);

  if (week) {
    weekNumber = parseInt(week, 10);
    if (isNaN(weekNumber)) {
      notFound();
    }
  } else {
    if (!latest) {
      return (
        <main className="min-h-screen bg-slate-50">
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/trainer/athletes"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
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
              <h1 className="text-lg font-semibold text-slate-900">
                Sin entrenamientos
              </h1>
            </div>
          </header>
          <div className="p-4 text-center text-slate-500">
            Este atleta no tiene entrenamientos programados.
          </div>
        </main>
      );
    }
    weekNumber = latest;
  }

  const weekData = await getAthleteWeek(athleteId, weekNumber);

  // If week doesn't exist and create=true, show dialog
  const showCreateDialog = !weekData && create === "true" && latest !== null;

  if (!weekData && !showCreateDialog) {
    notFound();
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
            <h1 className="text-lg font-semibold text-slate-900">
              {weekData?.athlete.name ?? "Atleta"} - Semana {weekNumber}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {weekData?.previousWeekExists ? (
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

            {weekData?.nextWeekExists ? (
              <Link
                href={`/trainer/athletes/${athleteId}?week=${weekNumber + 1}`}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Sem {weekNumber + 1} →
              </Link>
            ) : (
              <Link
                href={`/trainer/athletes/${athleteId}?week=${weekNumber + 1}&create=true`}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Sem {weekNumber + 1} →
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="p-4">
        {weekData && <WeekTable data={weekData} mode="edit" />}
      </div>

      {showCreateDialog && (
        <CreateWeekDialogTrigger
          athleteId={athleteId}
          trainerId={user.id}
          sourceWeek={latest!}
          targetWeek={weekNumber}
        />
      )}
    </main>
  );
}
```

**Step 2: Create CreateWeekDialogTrigger client component**

```typescript
// src/components/trainer/CreateWeekDialogTrigger.tsx
"use client";

import { useState, useEffect } from "react";
import CreateWeekDialog from "./CreateWeekDialog";

type CreateWeekDialogTriggerProps = {
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
}: CreateWeekDialogTriggerProps) {
  const [open, setOpen] = useState(true);

  return (
    <CreateWeekDialog
      open={open}
      onClose={() => setOpen(false)}
      athleteId={athleteId}
      trainerId={trainerId}
      sourceWeek={sourceWeek}
      targetWeek={targetWeek}
    />
  );
}
```

**Step 3: Test manually**

Run: `bun run dev`
Navigate to athlete week, click forward arrow to non-existent week
Expected: Dialog appears with copy/empty options

**Step 4: Commit**

```bash
git add src/app/trainer/ src/components/trainer/
git commit -m "feat(trainer): integrate create week dialog"
```

---

## Phase 4: Athlete Week View

### Task 15: Create Athlete Week Page

**Files:**
- Create: `src/app/week/page.tsx`

**Step 1: Create the page**

```typescript
// src/app/week/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import { getLatestWeekNumber } from "@/lib/trainer/getLatestWeekNumber";
import WeekTable from "@/components/trainer/WeekTable";
import AthleteWeekClient from "@/components/athlete/AthleteWeekClient";

type WeekPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function WeekPage({ searchParams }: WeekPageProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { week } = await searchParams;

  let weekNumber: number;
  if (week) {
    weekNumber = parseInt(week, 10);
    if (isNaN(weekNumber)) {
      notFound();
    }
  } else {
    const latest = await getLatestWeekNumber(user.id);
    if (!latest) {
      return (
        <main className="min-h-screen bg-slate-50">
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
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
              <h1 className="text-lg font-semibold text-slate-900">
                Mi semana
              </h1>
            </div>
          </header>
          <div className="p-4 text-center text-slate-500">
            No tenés entrenamientos programados.
          </div>
        </main>
      );
    }
    weekNumber = latest;
  }

  const weekData = await getAthleteWeek(user.id, weekNumber);

  if (!weekData) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
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
            <h1 className="text-lg font-semibold text-slate-900">
              Semana {weekNumber}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {weekData.previousWeekExists ? (
              <Link
                href={`/week?week=${weekNumber - 1}`}
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
                href={`/week?week=${weekNumber + 1}`}
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
        <AthleteWeekClient weekData={weekData} weekNumber={weekNumber} />
      </div>
    </main>
  );
}
```

**Step 2: Create AthleteWeekClient for day click handling**

```typescript
// src/components/athlete/AthleteWeekClient.tsx
"use client";

import { useRouter } from "next/navigation";
import WeekTable from "@/components/trainer/WeekTable";
import type { AthleteWeekData } from "@/lib/trainer/getAthleteWeek";

type AthleteWeekClientProps = {
  weekData: AthleteWeekData;
  weekNumber: number;
};

export default function AthleteWeekClient({
  weekData,
  weekNumber,
}: AthleteWeekClientProps) {
  const router = useRouter();

  const handleDayClick = (dayIndex: number) => {
    router.push(`/${weekNumber}/${dayIndex}`);
  };

  return (
    <WeekTable data={weekData} mode="readonly" onDayClick={handleDayClick} />
  );
}
```

**Step 3: Commit**

```bash
git add src/app/week/ src/components/athlete/
git commit -m "feat(athlete): add week overview page"
```

---

### Task 16: Final Verification

**Step 1: Run all tests**

Run: `bun test`
Expected: All tests pass

**Step 2: Manual E2E check**

Trainer flow:
1. Log in as trainer
2. Click avatar → "Mis atletas"
3. See athletes list with status
4. Click an athlete
5. See week table with inline editing
6. Edit some values, click save
7. Navigate to next week (non-existent)
8. Create dialog appears, select copy, create
9. New week appears with copied data

Athlete flow:
1. Log in as athlete
2. Click avatar → "Ver semana"
3. See read-only week table
4. Click a day row
5. Navigate to day view

**Step 3: Final commit**

```bash
git add .
git commit -m "feat(trainer): complete trainer dashboard implementation"
```
