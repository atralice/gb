# Athlete Workout Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first workout viewer for athletes with day picker, exercise detail modals, and set completion tracking.

**Architecture:** Replace homepage with redirect to `/[week]/[day]` route. Use vaul for bottom sheet modals. Client state for modal toggles, URL state for navigation.

**Tech Stack:** Next.js 16 App Router, Prisma, vaul (bottom sheets), date-fns (formatting), Tailwind CSS

---

## Task 1: Add weekStartDate to Schema

**Files:**
- Modify: `schema.prisma:64-84`
- Modify: `test/helpers/factories/workoutDayFactory.ts`

**Step 1: Update Prisma schema**

Edit `schema.prisma` to add `weekStartDate` field and new unique constraint:

```prisma
model WorkoutDay {
  id            String   @id @default(uuid())
  weekNumber    Int      @default(1)
  weekStartDate DateTime
  dayIndex      Int
  label         String?
  datePlanned   DateTime?
  notes         String?

  trainerId String
  athleteId String

  trainer User @relation("TrainerWorkoutDays", fields: [trainerId], references: [id])
  athlete User @relation("AthleteWorkoutDays", fields: [athleteId], references: [id])

  blocks WorkoutBlock[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([athleteId, weekNumber, dayIndex])
  @@unique([athleteId, weekStartDate, dayIndex])
}
```

**Step 2: Update workoutDayFactory**

Edit `test/helpers/factories/workoutDayFactory.ts` to include `weekStartDate`:

```typescript
function buildAttributes(): WorkoutDay {
  return {
    id: randomUUID(),
    weekNumber: 1,
    weekStartDate: new Date("2025-01-19"),
    dayIndex: 1,
    label: "Día 1",
    datePlanned: null,
    notes: null,
    trainerId: randomUUID(),
    athleteId: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createAttributes(
  attributes: CreateAttributes
): Prisma.WorkoutDayCreateInput {
  return {
    weekNumber: 1,
    weekStartDate: new Date("2025-01-19"),
    dayIndex: 1,
    label: "Día 1",
    ...attributes,
  };
}
```

**Step 3: Generate Prisma client and create migration**

Run:
```bash
bunx prisma generate
bunx prisma migrate dev --name add_week_start_date
```

Expected: Migration created, client regenerated.

**Step 4: Commit**

```bash
git add schema.prisma test/helpers/factories/workoutDayFactory.ts prisma/migrations/
git commit -m "feat: add weekStartDate to WorkoutDay schema"
```

---

## Task 2: Update Seed Script

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Add weekStartDate to WorkoutDayData type and createWorkoutDay**

Edit `prisma/seed.ts`:

```typescript
type WorkoutDayData = {
  dayIndex: number;
  weekNumber: number;
  weekStartDate: Date;
  notes?: string | null;
  blocks: BlockData[];
};

// In createWorkoutDay function:
async function createWorkoutDay(data: WorkoutDayData) {
  const workoutDay = await prisma.workoutDay.create({
    data: {
      trainerId: trainer.id,
      athleteId: athlete.id,
      weekNumber: data.weekNumber,
      weekStartDate: data.weekStartDate,
      dayIndex: data.dayIndex,
      label: `Día ${data.dayIndex}`,
      notes: data.notes,
    },
  });
  // ... rest unchanged
}
```

**Step 2: Update all createWorkoutDay calls**

Add `weekStartDate` to each call:

```typescript
// Semana 3 (all 3 days)
await createWorkoutDay({
  dayIndex: 1,
  weekNumber: 3,
  weekStartDate: new Date("2025-01-19"),
  // ...
});

await createWorkoutDay({
  dayIndex: 2,
  weekNumber: 3,
  weekStartDate: new Date("2025-01-19"),
  // ...
});

await createWorkoutDay({
  dayIndex: 3,
  weekNumber: 3,
  weekStartDate: new Date("2025-01-19"),
  // ...
});

// Semana 4 (all 3 days)
await createWorkoutDay({
  dayIndex: 1,
  weekNumber: 4,
  weekStartDate: new Date("2025-01-26"),
  // ...
});

await createWorkoutDay({
  dayIndex: 2,
  weekNumber: 4,
  weekStartDate: new Date("2025-01-26"),
  // ...
});

await createWorkoutDay({
  dayIndex: 3,
  weekNumber: 4,
  weekStartDate: new Date("2025-01-26"),
  // ...
});
```

**Step 3: Reset database and run seed**

Run:
```bash
bunx prisma migrate reset --force
```

Expected: Database reset, seed runs successfully.

**Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add weekStartDate to seed data"
```

---

## Task 3: Install vaul

**Step 1: Install dependency**

Run:
```bash
bun add vaul
```

**Step 2: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add vaul for bottom sheet modals"
```

---

## Task 4: Create Drawer Base Component

**Files:**
- Create: `src/components/ui/Drawer.tsx`

**Step 1: Create the Drawer component**

Create `src/components/ui/Drawer.tsx`:

```typescript
"use client";

import { Drawer as VaulDrawer } from "vaul";
import { cn } from "@/lib/cn";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <VaulDrawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "max-h-[85vh] rounded-t-3xl bg-white",
            "flex flex-col"
          )}
        >
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-slate-300" />
          <div className="overflow-y-auto p-6">{children}</div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}

export function DrawerTitle({ children }: { children: React.ReactNode }) {
  return (
    <VaulDrawer.Title className="mb-4 text-lg font-semibold text-slate-900">
      {children}
    </VaulDrawer.Title>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ui/Drawer.tsx
git commit -m "feat: add Drawer component using vaul"
```

---

## Task 5: Update getAvailableWorkoutDays Query

**Files:**
- Modify: `src/lib/workouts/getAvailableWorkoutDays.ts`

**Step 1: Add weekStartDate to select**

Edit `src/lib/workouts/getAvailableWorkoutDays.ts`:

```typescript
import prisma from "../prisma";

export async function getAvailableWorkoutDays() {
  const workoutDays = await prisma.workoutDay.findMany({
    select: {
      id: true,
      dayIndex: true,
      weekNumber: true,
      weekStartDate: true,
      label: true,
    },
    orderBy: [{ weekStartDate: "desc" }, { dayIndex: "asc" }],
  });

  return workoutDays;
}

export type AvailableWorkoutDay = Awaited<
  ReturnType<typeof getAvailableWorkoutDays>
>[number];
```

**Step 2: Run type check**

Run:
```bash
bun run type-check
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/workouts/getAvailableWorkoutDays.ts
git commit -m "feat: include weekStartDate in getAvailableWorkoutDays"
```

---

## Task 6: Create getSuggestedWorkoutDay Query

**Files:**
- Create: `src/lib/workouts/getSuggestedWorkoutDay.ts`
- Create: `src/lib/workouts/__tests__/getSuggestedWorkoutDay.test.ts`

**Step 1: Write the failing test**

Create `src/lib/workouts/__tests__/getSuggestedWorkoutDay.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { getSuggestedWorkoutDay } from "../getSuggestedWorkoutDay";
import prisma from "@/lib/prisma";
import truncateDb from "test/helpers/test-helpers";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";

describe("getSuggestedWorkoutDay", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  it("returns null when athlete has no workout days", async () => {
    const athlete = await userFactory.create({ role: "athlete" });

    const result = await getSuggestedWorkoutDay(athlete.id);

    expect(result).toBeNull();
  });

  it("returns day 1 of latest week when no days completed", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const athlete = await userFactory.create({ role: "athlete" });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 4,
      weekStartDate: new Date("2025-01-26"),
      dayIndex: 1,
    });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 4,
      weekStartDate: new Date("2025-01-26"),
      dayIndex: 2,
    });

    const result = await getSuggestedWorkoutDay(athlete.id);

    expect(result).toEqual({ weekNumber: 4, dayIndex: 1 });
  });

  it("returns latest week by weekStartDate, not weekNumber", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const athlete = await userFactory.create({ role: "athlete" });

    // Week 3 has a later weekStartDate than week 10
    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 10,
      weekStartDate: new Date("2025-01-01"),
      dayIndex: 1,
    });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 3,
      weekStartDate: new Date("2025-01-26"),
      dayIndex: 1,
    });

    const result = await getSuggestedWorkoutDay(athlete.id);

    expect(result).toEqual({ weekNumber: 3, dayIndex: 1 });
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun test src/lib/workouts/__tests__/getSuggestedWorkoutDay.test.ts
```

Expected: FAIL with "Cannot find module" or similar.

**Step 3: Write minimal implementation**

Create `src/lib/workouts/getSuggestedWorkoutDay.ts`:

```typescript
import prisma from "../prisma";

type SuggestedDay = {
  weekNumber: number;
  dayIndex: number;
} | null;

export async function getSuggestedWorkoutDay(
  athleteId: string
): Promise<SuggestedDay> {
  // 1. Get latest week by weekStartDate
  const latestDay = await prisma.workoutDay.findFirst({
    where: { athleteId },
    orderBy: { weekStartDate: "desc" },
    select: { weekNumber: true },
  });

  if (!latestDay) {
    return null;
  }

  // 2. For now, just return day 1 of latest week
  // (completion logic will be added in a future task)
  return {
    weekNumber: latestDay.weekNumber,
    dayIndex: 1,
  };
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bun test src/lib/workouts/__tests__/getSuggestedWorkoutDay.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/workouts/getSuggestedWorkoutDay.ts src/lib/workouts/__tests__/getSuggestedWorkoutDay.test.ts
git commit -m "feat: add getSuggestedWorkoutDay query"
```

---

## Task 7: Create Homepage Redirect

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace homepage with redirect logic**

Edit `src/app/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { getSuggestedWorkoutDay } from "@/lib/workouts/getSuggestedWorkoutDay";

// TODO: Replace with actual auth
const HARDCODED_ATHLETE_ID = "will-be-replaced-after-seed";

export default async function HomePage() {
  // For now, get the first athlete from DB
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const athlete = await prisma.user.findFirst({
    where: { role: "athlete" },
  });
  await prisma.$disconnect();

  if (!athlete) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No athlete found</h1>
          <p className="text-slate-600">
            Please run the seed script to populate the database.
          </p>
        </div>
      </main>
    );
  }

  const suggested = await getSuggestedWorkoutDay(athlete.id);

  if (!suggested) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No workouts found</h1>
          <p className="text-slate-600">
            Please run the seed script to populate the database.
          </p>
        </div>
      </main>
    );
  }

  redirect(`/${suggested.weekNumber}/${suggested.dayIndex}`);
}
```

**Step 2: Run type check**

Run:
```bash
bun run type-check
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: homepage redirects to suggested workout day"
```

---

## Task 8: Create Workout Page Route

**Files:**
- Create: `src/app/[week]/[day]/page.tsx`
- Modify: `src/lib/workouts/getWorkoutDay.ts`

**Step 1: Update getWorkoutDay to accept athleteId**

Edit `src/lib/workouts/getWorkoutDay.ts`:

```typescript
import prisma from "../prisma";
import type { Prisma } from "@prisma/client";

export async function getWorkoutDay(
  athleteId: string,
  weekNumber: number,
  dayIndex: number
) {
  const workoutDay = await prisma.workoutDay.findFirst({
    where: {
      athleteId,
      weekNumber,
      dayIndex,
    },
    include: {
      blocks: {
        include: {
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  instructions: true,
                  videoUrl: true,
                  tags: true,
                },
              },
              sets: {
                orderBy: {
                  setIndex: "asc",
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  return workoutDay;
}

export type WorkoutDayWithBlocks = Prisma.PromiseReturnType<
  typeof getWorkoutDay
>;
```

**Step 2: Create the workout page**

Create `src/app/[week]/[day]/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { getWorkoutDay } from "@/lib/workouts/getWorkoutDay";
import { getAvailableWorkoutDays } from "@/lib/workouts/getAvailableWorkoutDays";
import prisma from "@/lib/prisma";

type WorkoutPageProps = {
  params: Promise<{ week: string; day: string }>;
  searchParams: Promise<{ block?: string }>;
};

export default async function WorkoutPage({
  params,
  searchParams,
}: WorkoutPageProps) {
  const { week, day } = await params;
  const { block } = await searchParams;

  const weekNumber = parseInt(week, 10);
  const dayIndex = parseInt(day, 10);
  const blockIndex = block ? parseInt(block, 10) : 0;

  // Validate params
  if (isNaN(weekNumber) || isNaN(dayIndex)) {
    notFound();
  }

  // TODO: Replace with actual auth
  const athlete = await prisma.user.findFirst({
    where: { role: "athlete" },
  });

  if (!athlete) {
    notFound();
  }

  const [workoutDay, availableDays] = await Promise.all([
    getWorkoutDay(athlete.id, weekNumber, dayIndex),
    getAvailableWorkoutDays(),
  ]);

  if (!workoutDay) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header placeholder */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pb-4 pt-12">
        <h1 className="text-2xl font-bold text-slate-900">
          Día {workoutDay.dayIndex}
        </h1>
        <p className="text-sm text-slate-400">
          Semana {workoutDay.weekNumber}
        </p>
      </header>

      {/* Content placeholder */}
      <div className="p-4">
        <p className="text-slate-600">
          Workout page for week {weekNumber}, day {dayIndex}, block {blockIndex}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {workoutDay.blocks.length} blocks,{" "}
          {workoutDay.blocks.reduce((acc, b) => acc + b.exercises.length, 0)}{" "}
          exercises
        </p>
      </div>
    </main>
  );
}
```

**Step 3: Run dev server and test**

Run:
```bash
bun run dev
```

Navigate to `http://localhost:3000` - should redirect to `/4/1` (or similar).
Navigate to `http://localhost:3000/4/1` - should show placeholder content.

**Step 4: Commit**

```bash
git add src/app/[week]/[day]/page.tsx src/lib/workouts/getWorkoutDay.ts
git commit -m "feat: add workout page route with data fetching"
```

---

## Task 9: Create WorkoutHeader Component

**Files:**
- Create: `src/components/workout/WorkoutHeader.tsx`

**Step 1: Create the component**

Create `src/components/workout/WorkoutHeader.tsx`:

```typescript
"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/cn";

type Block = {
  id: string;
  label: string | null;
  order: number;
};

type WorkoutHeaderProps = {
  dayIndex: number;
  weekNumber: number;
  weekStartDate: Date;
  blocks: Block[];
  activeBlockIndex: number;
  onBlockSelect: (index: number) => void;
  onHeaderTap: () => void;
  isSuggested?: boolean;
};

export default function WorkoutHeader({
  dayIndex,
  weekNumber,
  weekStartDate,
  blocks,
  activeBlockIndex,
  onBlockSelect,
  onHeaderTap,
  isSuggested = false,
}: WorkoutHeaderProps) {
  const formattedDate = format(weekStartDate, "d MMM", { locale: es });

  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pb-4 pt-12">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onHeaderTap} className="group flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Día {dayIndex}</h1>
            <p className="text-sm text-slate-400">
              Semana {weekNumber} · {formattedDate}
            </p>
          </div>
          <svg
            className="h-5 w-5 text-slate-400 transition-colors group-hover:text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </button>

        {isSuggested && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700">
            Sugerido
          </span>
        )}
      </div>

      {/* Block pills */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {blocks.map((block, index) => (
          <button
            key={block.id}
            onClick={() => onBlockSelect(index)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all",
              activeBlockIndex === index
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {block.label || `Bloque ${index + 1}`}
          </button>
        ))}
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/workout/WorkoutHeader.tsx
git commit -m "feat: add WorkoutHeader component"
```

---

## Task 10: Create SetPill Component

**Files:**
- Create: `src/components/workout/SetPill.tsx`

**Step 1: Create the component**

Create `src/components/workout/SetPill.tsx`:

```typescript
"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/cn";

type SetPillProps = {
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
  completed?: boolean;
  onTap?: () => void;
  onDoubleTap?: () => void;
  colorClasses?: string;
};

export default function SetPill({
  reps,
  weightKg,
  durationSeconds,
  repsPerSide,
  completed = false,
  onTap,
  onDoubleTap,
  colorClasses,
}: SetPillProps) {
  const lastTapRef = useRef(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTap?.();
    } else {
      onTap?.();
    }
    lastTapRef.current = now;
  };

  const isTimeBased = durationSeconds != null && durationSeconds > 0;
  const hasWeight = weightKg != null && weightKg > 0;

  return (
    <button
      onClick={handleTap}
      className={cn(
        "flex min-w-16 flex-col items-center justify-center rounded-xl px-4 py-3 transition-all duration-200",
        completed
          ? "bg-emerald-500 text-white shadow-md"
          : colorClasses || "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
      )}
    >
      <span className="text-2xl font-bold leading-none">
        {isTimeBased ? durationSeconds : (reps ?? "x")}
      </span>
      <span className="mt-0.5 text-xs opacity-75">
        {isTimeBased ? "seg" : repsPerSide ? "c/lado" : "reps"}
      </span>
      {hasWeight && (
        <span className="mt-1 text-xs font-medium">{weightKg}kg</span>
      )}
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/workout/SetPill.tsx
git commit -m "feat: add SetPill component with tap/double-tap"
```

---

## Task 11: Create ExerciseCard Component

**Files:**
- Modify: `src/components/workout/ExerciseCard.tsx`

**Step 1: Rewrite ExerciseCard for athlete view**

Edit `src/components/workout/ExerciseCard.tsx`:

```typescript
"use client";

import { useState } from "react";
import SetPill from "./SetPill";
import { calculateVolumes, getSetColorClasses } from "@/lib/workouts/setColors";
import type { Set } from "@prisma/client";

type Exercise = {
  id: string;
  name: string;
  instructions: string | null;
  videoUrl: string | null;
  tags: string[];
};

type SetForDisplay = Pick<
  Set,
  "id" | "setIndex" | "reps" | "weightKg" | "repsPerSide" | "durationSeconds"
>;

type ExerciseCardProps = {
  exercise: Exercise;
  comment: string | null;
  sets: SetForDisplay[];
  onExerciseTap: () => void;
};

export default function ExerciseCard({
  exercise,
  comment,
  sets,
  onExerciseTap,
}: ExerciseCardProps) {
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());

  const { volumes, minVolume, maxVolume } = calculateVolumes(sets);
  const allCompleted = completedSets.size === sets.length && sets.length > 0;

  const toggleSet = (setId: string) => {
    setCompletedSets((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300",
        allCompleted ? "border-emerald-300 bg-emerald-50/30" : "border-slate-100"
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-3">
        <button
          onClick={onExerciseTap}
          className="group min-w-0 flex-1 text-left"
        >
          <h3
            className={cn(
              "text-base font-semibold leading-tight transition-colors group-hover:text-blue-600",
              allCompleted ? "text-emerald-700" : "text-slate-800"
            )}
          >
            {exercise.name}
            <svg
              className="ml-1.5 inline-block h-4 w-4 opacity-40 transition-opacity group-hover:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </h3>
        </button>

        <div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            allCompleted
              ? "border-emerald-500 bg-emerald-500"
              : "border-slate-300"
          )}
        >
          {allCompleted && (
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {comment && (
        <p className="mb-3 text-xs leading-relaxed text-slate-500">{comment}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {sets.map((set, index) => {
          const volume = volumes[index] ?? 0;
          const colorClasses = completedSets.has(set.id)
            ? undefined
            : getSetColorClasses(volume, minVolume, maxVolume);

          return (
            <SetPill
              key={set.id}
              reps={set.reps}
              weightKg={set.weightKg}
              durationSeconds={set.durationSeconds}
              repsPerSide={set.repsPerSide}
              completed={completedSets.has(set.id)}
              colorClasses={colorClasses}
              onTap={() => toggleSet(set.id)}
              onDoubleTap={() => {
                console.log("Double tap - open edit modal for set", set.id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Need to import cn
import { cn } from "@/lib/cn";
```

**Step 2: Fix import order (cn at top)**

Move the `cn` import to the top of the file with other imports.

**Step 3: Commit**

```bash
git add src/components/workout/ExerciseCard.tsx
git commit -m "feat: rewrite ExerciseCard for athlete view with completion state"
```

---

## Task 12: Create BlockContent Component

**Files:**
- Create: `src/components/workout/BlockContent.tsx`

**Step 1: Create the component**

Create `src/components/workout/BlockContent.tsx`:

```typescript
"use client";

import ExerciseCard from "./ExerciseCard";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";

type Block = NonNullable<WorkoutDayWithBlocks>["blocks"][number];

type BlockContentProps = {
  block: Block;
  onExerciseTap: (exercise: Block["exercises"][number]) => void;
};

export default function BlockContent({ block, onExerciseTap }: BlockContentProps) {
  return (
    <div className="p-4">
      {/* Block comment */}
      {block.comment && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-amber-800">{block.comment}</p>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {block.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise.exercise}
            comment={exercise.comment}
            sets={exercise.sets}
            onExerciseTap={() => onExerciseTap(exercise)}
          />
        ))}
      </div>

      {/* Interaction hint */}
      <p className="mt-6 text-center text-xs text-slate-400">
        Tap set para completar · Doble tap para editar
      </p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/workout/BlockContent.tsx
git commit -m "feat: add BlockContent component"
```

---

## Task 13: Create DayPickerDrawer Component

**Files:**
- Create: `src/components/workout/DayPickerDrawer.tsx`

**Step 1: Create the component**

Create `src/components/workout/DayPickerDrawer.tsx`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import type { AvailableWorkoutDay } from "@/lib/workouts/getAvailableWorkoutDays";

type DayPickerDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDays: AvailableWorkoutDay[];
  currentWeek: number;
  currentDay: number;
  suggestedDay: number;
};

export default function DayPickerDrawer({
  open,
  onOpenChange,
  availableDays,
  currentWeek,
  currentDay,
  suggestedDay,
}: DayPickerDrawerProps) {
  const router = useRouter();

  // Group days by week
  const weekMap = new Map<number, { weekStartDate: Date; days: AvailableWorkoutDay[] }>();

  for (const day of availableDays) {
    if (!weekMap.has(day.weekNumber)) {
      weekMap.set(day.weekNumber, {
        weekStartDate: day.weekStartDate,
        days: [],
      });
    }
    weekMap.get(day.weekNumber)!.days.push(day);
  }

  const weeks = Array.from(weekMap.entries())
    .sort((a, b) => b[1].weekStartDate.getTime() - a[1].weekStartDate.getTime());

  const currentWeekData = weekMap.get(currentWeek);
  const daysInCurrentWeek = currentWeekData?.days ?? [];

  const handleWeekSelect = (weekNumber: number) => {
    const weekData = weekMap.get(weekNumber);
    if (weekData && weekData.days.length > 0) {
      const firstDay = weekData.days[0];
      router.push(`/${weekNumber}/${firstDay.dayIndex}`);
      onOpenChange(false);
    }
  };

  const handleDaySelect = (dayIndex: number) => {
    router.push(`/${currentWeek}/${dayIndex}`);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTitle>Elegir entrenamiento</DrawerTitle>

      {/* Week selector */}
      <p className="mb-2 text-sm text-slate-500">Semana</p>
      <div className="mb-6 flex gap-2">
        {weeks.map(([weekNumber, data]) => (
          <button
            key={weekNumber}
            onClick={() => handleWeekSelect(weekNumber)}
            className={cn(
              "flex-1 rounded-xl py-3 text-sm font-medium transition-all",
              currentWeek === weekNumber
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <div>Semana {weekNumber}</div>
            <div className="text-xs opacity-75">
              {format(data.weekStartDate, "d MMM", { locale: es })}
            </div>
          </button>
        ))}
      </div>

      {/* Day selector */}
      <p className="mb-2 text-sm text-slate-500">Día</p>
      <div className="flex gap-2">
        {daysInCurrentWeek
          .sort((a, b) => a.dayIndex - b.dayIndex)
          .map((day) => (
            <button
              key={day.id}
              onClick={() => handleDaySelect(day.dayIndex)}
              className={cn(
                "relative flex-1 rounded-xl py-4 text-sm font-medium transition-all",
                currentDay === day.dayIndex
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Día {day.dayIndex}
              {day.dayIndex === suggestedDay && (
                <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-1.5 py-0.5 text-xs text-amber-900">
                  Sugerido
                </span>
              )}
            </button>
          ))}
      </div>
    </Drawer>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/workout/DayPickerDrawer.tsx
git commit -m "feat: add DayPickerDrawer component"
```

---

## Task 14: Create ExerciseDetailDrawer Component

**Files:**
- Create: `src/components/workout/ExerciseDetailDrawer.tsx`

**Step 1: Create the component**

Create `src/components/workout/ExerciseDetailDrawer.tsx`:

```typescript
"use client";

import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";

type Exercise = NonNullable<WorkoutDayWithBlocks>["blocks"][number]["exercises"][number];

const tagColors: Record<string, string> = {
  fuerza: "bg-blue-100 text-blue-700",
  piernas: "bg-amber-100 text-amber-700",
  unilateral: "bg-purple-100 text-purple-700",
  pecho: "bg-rose-100 text-rose-700",
  espalda: "bg-cyan-100 text-cyan-700",
  core: "bg-green-100 text-green-700",
  pliometrico: "bg-orange-100 text-orange-700",
  gluteos: "bg-pink-100 text-pink-700",
  movilidad: "bg-teal-100 text-teal-700",
  agilidad: "bg-indigo-100 text-indigo-700",
  isquiotibiales: "bg-yellow-100 text-yellow-700",
  "espalda baja": "bg-slate-200 text-slate-700",
  hombros: "bg-sky-100 text-sky-700",
  pull: "bg-violet-100 text-violet-700",
  potencia: "bg-red-100 text-red-700",
  warmup: "bg-lime-100 text-lime-700",
  estabilidad: "bg-emerald-100 text-emerald-700",
  activacion: "bg-fuchsia-100 text-fuchsia-700",
  "full body": "bg-gray-100 text-gray-700",
  "anti-rotacion": "bg-stone-100 text-stone-700",
};

type ExerciseDetailDrawerProps = {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ExerciseDetailDrawer({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailDrawerProps) {
  if (!exercise) return null;

  const { exercise: exerciseData, comment } = exercise;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTitle>{exerciseData.name}</DrawerTitle>

      {/* Tags */}
      {exerciseData.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {exerciseData.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                tagColors[tag] || "bg-slate-100 text-slate-600"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Instructions */}
      {exerciseData.instructions && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-slate-500">
            Instrucciones
          </h3>
          <p className="leading-relaxed text-slate-700">
            {exerciseData.instructions}
          </p>
        </div>
      )}

      {/* Session comment */}
      {comment && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <h3 className="mb-1 text-sm font-medium text-amber-700">
            Nota de hoy
          </h3>
          <p className="text-sm text-amber-800">{comment}</p>
        </div>
      )}

      {/* Video link */}
      {exerciseData.videoUrl && (
        <a
          href={exerciseData.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700 transition-colors hover:bg-red-100"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600">
            <svg
              className="h-5 w-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Ver video</p>
            <p className="text-xs opacity-75">Abrir en YouTube</p>
          </div>
          <svg
            className="ml-auto h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}

      {/* Close button */}
      <button
        onClick={() => onOpenChange(false)}
        className="w-full rounded-xl bg-slate-100 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-200"
      >
        Cerrar
      </button>
    </Drawer>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/workout/ExerciseDetailDrawer.tsx
git commit -m "feat: add ExerciseDetailDrawer component"
```

---

## Task 15: Create WorkoutViewer Component

**Files:**
- Create: `src/components/workout/WorkoutViewer.tsx`

**Step 1: Create the component**

Create `src/components/workout/WorkoutViewer.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WorkoutHeader from "./WorkoutHeader";
import BlockContent from "./BlockContent";
import DayPickerDrawer from "./DayPickerDrawer";
import ExerciseDetailDrawer from "./ExerciseDetailDrawer";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";
import type { AvailableWorkoutDay } from "@/lib/workouts/getAvailableWorkoutDays";

type WorkoutViewerProps = {
  workoutDay: NonNullable<WorkoutDayWithBlocks>;
  availableDays: AvailableWorkoutDay[];
  initialBlockIndex: number;
  suggestedDay: number;
};

export default function WorkoutViewer({
  workoutDay,
  availableDays,
  initialBlockIndex,
  suggestedDay,
}: WorkoutViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeBlockIndex, setActiveBlockIndex] = useState(initialBlockIndex);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<
    NonNullable<WorkoutDayWithBlocks>["blocks"][number]["exercises"][number] | null
  >(null);

  const blocks = workoutDay.blocks.filter((b) => b.exercises.length > 0);
  const activeBlock = blocks[activeBlockIndex];

  const handleBlockSelect = (index: number) => {
    setActiveBlockIndex(index);
    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set("block", index.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const isSuggested = workoutDay.dayIndex === suggestedDay;

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkoutHeader
        dayIndex={workoutDay.dayIndex}
        weekNumber={workoutDay.weekNumber}
        weekStartDate={workoutDay.weekStartDate}
        blocks={blocks}
        activeBlockIndex={activeBlockIndex}
        onBlockSelect={handleBlockSelect}
        onHeaderTap={() => setDayPickerOpen(true)}
        isSuggested={isSuggested}
      />

      {activeBlock && (
        <BlockContent
          block={activeBlock}
          onExerciseTap={setSelectedExercise}
        />
      )}

      <DayPickerDrawer
        open={dayPickerOpen}
        onOpenChange={setDayPickerOpen}
        availableDays={availableDays}
        currentWeek={workoutDay.weekNumber}
        currentDay={workoutDay.dayIndex}
        suggestedDay={suggestedDay}
      />

      <ExerciseDetailDrawer
        exercise={selectedExercise}
        open={!!selectedExercise}
        onOpenChange={(open) => !open && setSelectedExercise(null)}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/workout/WorkoutViewer.tsx
git commit -m "feat: add WorkoutViewer container component"
```

---

## Task 16: Wire Up Workout Page

**Files:**
- Modify: `src/app/[week]/[day]/page.tsx`

**Step 1: Update page to use WorkoutViewer**

Edit `src/app/[week]/[day]/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { getWorkoutDay } from "@/lib/workouts/getWorkoutDay";
import { getAvailableWorkoutDays } from "@/lib/workouts/getAvailableWorkoutDays";
import { getSuggestedWorkoutDay } from "@/lib/workouts/getSuggestedWorkoutDay";
import WorkoutViewer from "@/components/workout/WorkoutViewer";
import prisma from "@/lib/prisma";

type WorkoutPageProps = {
  params: Promise<{ week: string; day: string }>;
  searchParams: Promise<{ block?: string }>;
};

export default async function WorkoutPage({
  params,
  searchParams,
}: WorkoutPageProps) {
  const { week, day } = await params;
  const { block } = await searchParams;

  const weekNumber = parseInt(week, 10);
  const dayIndex = parseInt(day, 10);
  const blockIndex = block ? parseInt(block, 10) : 0;

  if (isNaN(weekNumber) || isNaN(dayIndex)) {
    notFound();
  }

  // TODO: Replace with actual auth
  const athlete = await prisma.user.findFirst({
    where: { role: "athlete" },
  });

  if (!athlete) {
    notFound();
  }

  const [workoutDay, availableDays, suggested] = await Promise.all([
    getWorkoutDay(athlete.id, weekNumber, dayIndex),
    getAvailableWorkoutDays(),
    getSuggestedWorkoutDay(athlete.id),
  ]);

  if (!workoutDay) {
    notFound();
  }

  return (
    <WorkoutViewer
      workoutDay={workoutDay}
      availableDays={availableDays}
      initialBlockIndex={blockIndex}
      suggestedDay={suggested?.dayIndex ?? 1}
    />
  );
}
```

**Step 2: Run dev server and test**

Run:
```bash
bun run dev
```

Navigate to `http://localhost:3000` and verify:
- Redirects to `/4/1`
- Shows workout header with day/week/date
- Block pills work
- Exercise cards show
- Day picker drawer opens
- Exercise detail drawer opens

**Step 3: Commit**

```bash
git add src/app/[week]/[day]/page.tsx
git commit -m "feat: wire up WorkoutViewer to workout page"
```

---

## Task 17: Delete Old Components

**Files:**
- Delete: `src/components/workout/WorkoutCarousel.tsx`
- Delete: `src/components/workout/WorkoutDaySelector.tsx`
- Delete: `src/components/workout/BlockHeader.tsx`
- Delete: `src/components/workout/ExerciseSetPills.tsx`
- Delete: `src/components/trainer/` (entire directory)

**Step 1: Delete files**

Run:
```bash
rm src/components/workout/WorkoutCarousel.tsx
rm src/components/workout/WorkoutDaySelector.tsx
rm src/components/workout/BlockHeader.tsx
rm src/components/workout/ExerciseSetPills.tsx
rm -rf src/components/trainer
```

**Step 2: Run type check to verify no broken imports**

Run:
```bash
bun run type-check
```

Expected: No errors (or fix any broken imports).

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete old workout and trainer components"
```

---

## Task 18: Final Testing

**Step 1: Reset database and seed**

Run:
```bash
bunx prisma migrate reset --force
```

**Step 2: Run all tests**

Run:
```bash
bun test
```

Expected: All tests pass.

**Step 3: Manual testing checklist**

- [ ] Homepage redirects to suggested day
- [ ] Week/day shows in header with formatted date
- [ ] Block pills switch content
- [ ] Exercise cards show with set pills
- [ ] Tapping set toggles completion state
- [ ] Tapping exercise name opens detail drawer
- [ ] Detail drawer shows tags, instructions, comment, video link
- [ ] Tapping header opens day picker drawer
- [ ] Day picker shows weeks and days
- [ ] Selecting different day navigates correctly
- [ ] "Sugerido" badge shows on suggested day

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete athlete workout viewer implementation"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add weekStartDate to schema |
| 2 | Update seed script |
| 3 | Install vaul |
| 4 | Create Drawer base component |
| 5 | Update getAvailableWorkoutDays |
| 6 | Create getSuggestedWorkoutDay |
| 7 | Create homepage redirect |
| 8 | Create workout page route |
| 9 | Create WorkoutHeader |
| 10 | Create SetPill |
| 11 | Rewrite ExerciseCard |
| 12 | Create BlockContent |
| 13 | Create DayPickerDrawer |
| 14 | Create ExerciseDetailDrawer |
| 15 | Create WorkoutViewer |
| 16 | Wire up workout page |
| 17 | Delete old components |
| 18 | Final testing |
