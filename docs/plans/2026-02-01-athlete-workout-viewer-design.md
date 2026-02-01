# Athlete Workout Viewer - Design

## Overview

Mobile-first PWA for athletes to view prescribed workouts, track set completion, and navigate between training days. Replaces the current homepage with a focused workout experience.

## Schema Change

Add `weekStartDate` to `WorkoutDay`:

```prisma
model WorkoutDay {
  id            String   @id @default(uuid())
  weekNumber    Int      @default(1)
  weekStartDate DateTime // Required - anchors week to calendar
  dayIndex      Int
  label         String?
  datePlanned   DateTime?
  notes         String?

  // ... relations unchanged

  @@unique([athleteId, weekNumber, dayIndex])
  @@unique([athleteId, weekStartDate, dayIndex])
}
```

Display format: "Semana 4 · 26 ene"

## Routing

```
/                    → Redirect to suggested day
/[week]/[day]        → Workout viewer (block defaults to 0)
/[week]/[day]?block=2 → Specific block
```

File structure:
```
src/app/
├── page.tsx                    → Calculate suggested day, redirect
└── [week]/[day]/
    └── page.tsx                → Workout viewer
```

## Component Architecture

```
src/components/workout/
├── WorkoutViewer.tsx          → Main container, manages modal state
├── WorkoutHeader.tsx          → "Día 1 / Semana 4 · 26 ene" + block pills
├── BlockContent.tsx           → Block comment + exercise list
├── ExerciseCard.tsx           → Exercise with sets (tap to open detail)
├── SetPill.tsx                → Individual set (tap to complete)
├── DayPickerDrawer.tsx        → Bottom sheet for week/day selection
└── ExerciseDetailDrawer.tsx   → Bottom sheet for exercise info
```

### State Management

- **URL state**: `week`, `day`, `block` (server-rendered)
- **Client state**: modal open/close, set completion (optimistic UI)
- **Server actions**: `SetLog` writes on set tap

### Shared Utilities (keep)

- `src/lib/workouts/setColors.ts` — Color logic for set pills
- `src/lib/cn.ts` — Class name utility

## Modal System

Using [vaul](https://github.com/emilkowalski/vaul) for native-feeling bottom sheets with drag-to-dismiss.

```typescript
import { Drawer } from "vaul";

<Drawer.Root open={open} onOpenChange={setOpen}>
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 bg-black/40" />
    <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl">
      <div className="mx-auto w-12 h-1.5 bg-slate-300 rounded-full mt-4 mb-2" />
      {/* Content */}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

### DayPickerDrawer

- Opens when tapping header
- Week buttons with formatted `weekStartDate`
- Day buttons with "Sugerido" badge and last completed date
- Navigation via `router.push()`

### ExerciseDetailDrawer

- Opens when tapping exercise name
- Shows: title, tags, instructions, session comment (amber), video link

## Smart Day Suggestion

```typescript
async function getSuggestedWorkoutDay(athleteId: string) {
  // 1. Get latest week by weekStartDate
  // 2. Get all days for that week with completion status
  // 3. Find first incomplete day, or cycle back to day 1

  const completedDays = days.filter(isFullyCompleted).map(d => d.dayIndex);
  const maxCompleted = Math.max(0, ...completedDays);
  return maxCompleted >= 3 ? 1 : maxCompleted + 1;
}
```

Edge cases:
- No workout days → Show empty state (no redirect)
- All days completed → Suggest day 1 (new cycle)

## Files to Delete

```
src/components/workout/WorkoutDaySelector.tsx
src/components/trainer/*
```

## Visual Style

From spec:
- Background: `slate-50`
- Cards: `white` with `slate-100` border, `rounded-2xl`
- Primary buttons: `slate-800`
- Completed state: `emerald-500`
- Warnings/notes: `amber-50` with `amber-200` border
- Set pills: `rounded-xl`, large number with label below
