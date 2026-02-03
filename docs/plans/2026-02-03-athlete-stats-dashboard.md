# Athlete Stats Dashboard

## Overview

A dedicated `/stats` page for athletes to view their training progress. MVP focuses on three key metrics: weekly completion, adherence to prescription, and personal records.

## Navigation

- Access via avatar menu in WorkoutViewer
- New menu item: "Estadísticas" (placed before "Cerrar sesión")
- Back navigation returns to workout

## Page Layout

Single scrollable page with three stacked cards:

```
┌─────────────────────────────┐
│  ← Estadísticas             │
├─────────────────────────────┤
│  Weekly Completion Card     │
│  Adherence Card             │
│  Personal Records Card      │
└─────────────────────────────┘
```

## Card Specifications

### 1. Weekly Completion

Shows completion rate for current week.

**Display:**
- Progress bar
- Percentage
- Breakdown: "9/12 completados (3 salteados)"

**Calculation:**
- Query sets where WorkoutDay.weekStartDate = current week
- completed = sets with `completed: true`
- skipped = sets with `skipped: true`
- total = all sets
- percentage = completed / total

### 2. Adherence

Compares actual vs prescribed values.

**Display:**
- Average weight difference (e.g., "+2.3kg promedio")
- Average reps difference (e.g., "-0.5 promedio")
- Toggle: "esta semana" / "último mes"

**Calculation:**
- For completed sets only (not skipped)
- weightDiff = actualWeightKg - weightKg
- repsDiff = actualReps - reps
- Average across selected time range

**Implementation:**
- Time range via URL search param: `?range=week` or `?range=month`
- Default: week

### 3. Personal Records

Top 5 exercises by heaviest weight lifted.

**Display:**
- Exercise name
- Max weight (kg)
- Sorted by weight descending, limited to 5

**Calculation:**
- Group completed sets by exerciseId
- Find max actualWeightKg per exercise
- Sort by weight, take top 5

## Data Architecture

### Query Function

```typescript
// src/lib/stats/getAthleteStats.ts

type AthleteStats = {
  weeklyCompletion: {
    completed: number;
    skipped: number;
    total: number;
  };
  adherence: {
    range: "week" | "month";
    avgWeightDiff: number | null;  // null if no data
    avgRepsDiff: number | null;
  };
  personalRecords: Array<{
    exerciseName: string;
    weightKg: number;
    achievedAt: Date;
  }>;
};

function getAthleteStats(
  userId: string,
  adherenceRange: "week" | "month"
): Promise<AthleteStats>
```

### Page Component

```typescript
// src/app/stats/page.tsx

- Server component
- Reads ?range param for adherence toggle
- Calls getAthleteStats()
- Renders three card components
```

## Files to Create/Modify

**New files:**
- `src/app/stats/page.tsx` - page component
- `src/lib/stats/getAthleteStats.ts` - data query
- `src/components/stats/WeeklyCompletionCard.tsx`
- `src/components/stats/AdherenceCard.tsx`
- `src/components/stats/PersonalRecordsCard.tsx`

**Modified files:**
- Avatar menu component - add "Estadísticas" link

## Future Expansion

Designed to easily add:
- More time range options
- Additional metrics (streaks, volume trends, RPE when collected)
- Drill-down into exercise history
- Charts/graphs
