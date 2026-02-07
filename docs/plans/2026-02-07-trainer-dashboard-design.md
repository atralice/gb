# Trainer Dashboard Design

## Overview

A dashboard for trainers to manage their athletes' workout plans. Trainers view a list of their athletes, click into an athlete to see/edit their weekly workout plan, and can copy weeks forward to create new programs.

## Route Structure

### Trainer Routes
- `/trainer/athletes` - Searchable list of trainer's athletes
- `/trainer/athletes/[athleteId]?week=5` - Editable week view for specific athlete

### Athlete Routes (new)
- `/week?week=5` - Read-only week overview for logged-in athlete
- Clicking a day → navigates to existing `/[week]/[day]` view

### Access Control
- Role-based access via `getUser()`
- Trainers see "Mis atletas" in avatar dropdown
- Athletes see "Ver semana" in avatar dropdown
- Redirect if wrong role accesses wrong route

## Athletes List (`/trainer/athletes`)

### Table Columns

| Column | Description |
|--------|-------------|
| Nombre | Athlete name, clickable → week view |
| Última actividad | Relative time since last completed set |
| Completado | Current week: percentage + fraction (e.g., "75% (9/12)") |
| Estado | ✓ if OK, ⚠️ if needs attention |

### "Needs Attention" Rules
- No activity in 4+ days, OR
- Current week complete but next week doesn't exist

### Features
- Search input filters by name (client-side)
- Empty state: "No tenés atletas asignados"

## Week Table View

### Header
```
← Mis atletas    Toni - Semana 5       [← Sem 4] [Sem 6 →]
```
- Back link to athletes list
- Week navigation arrows
- Forward arrow to non-existent week triggers create dialog

### Table Structure (Trainer - Editable)

Single table with day headers as row separators:

| Ejercicio | Serie | Reps | Peso (kg) | Actual | Últ. sem |
|-----------|-------|------|-----------|--------|----------|
| **DÍA 1** |       |      |           |        |          |
| Peso muerto | 1 | 5 | [60] | 60 / 5 | 60 / 5 |
| | 2 | 4 | [85] | 85 / 4 | 85 / 4 |
| Sentadilla bulg | 1 | 6 | [15] | 15 / 6 | 15 / 6 |
| **DÍA 2** |       |      |           |        |          |

**Columns:**
- **Ejercicio** - Exercise name (spans rows for multiple sets)
- **Serie** - Set number
- **Reps** - Editable input (prescribed)
- **Peso (kg)** - Editable input (prescribed)
- **Actual** - What athlete did (read-only)
- **Últ. sem** - Last week's actual (read-only)

**Footer:** [Guardar cambios] button, disabled until changes made

### Table Structure (Athlete - Read-only)

| Ejercicio | Serie | Reps | Peso (kg) | Hecho |
|-----------|-------|------|-----------|-------|
| **DÍA 1** → ||| | 3/3 ✓ |
| Peso muerto | 1 | 5 | 60 | ✓ 60/5 |
| **DÍA 2** → ||| | 0/6 |

- Day header rows are clickable → navigate to `/[week]/[day]`
- Shows completion status per day
- No editing, no save button

## Create Week Dialog

When trainer clicks forward to non-existent week:

```
┌─────────────────────────────────────────┐
│   Crear semana 6                        │
│                                         │
│   ○ Copiar semana 5                     │
│   ○ Crear semana vacía                  │
│                                         │
│            [Cancelar]  [Crear]          │
└─────────────────────────────────────────┘
```

### Copy Week Logic
- Duplicate WorkoutDay records with new weekNumber/weekStartDate
- Copy all WorkoutBlock, WorkoutBlockExercise, Set records
- Only copy prescribed fields (reps, weightKg, durationSeconds, repsPerSide)
- Reset all actual values and completion status

### Empty Week Logic
- Create WorkoutDay records with same dayIndex values
- No blocks or exercises

## Data Architecture

### Query Functions

```typescript
// src/lib/trainer/getTrainerAthletes.ts
type TrainerAthlete = {
  id: string;
  name: string;
  email: string;
  lastActivity: Date | null;
  weeklyCompletion: { completed: number; total: number };
  needsAttention: boolean;
  attentionReason: "inactive" | "no_next_week" | null;
};

function getTrainerAthletes(trainerId: string): Promise<TrainerAthlete[]>
```

```typescript
// src/lib/trainer/getAthleteWeek.ts
type AthleteWeekData = {
  athlete: { id: string; name: string };
  weekNumber: number;
  weekStartDate: Date;
  previousWeekExists: boolean;
  nextWeekExists: boolean;
  days: Array<{
    dayIndex: number;
    label: string;
    exercises: Array<{
      exerciseName: string;
      sets: Array<{
        id: string;
        setIndex: number;
        reps: number | null;
        weightKg: number | null;
        actualReps: number | null;
        actualWeightKg: number | null;
        lastWeekActual: { reps: number; weightKg: number } | null;
      }>;
    }>;
  }>;
};

function getAthleteWeek(
  athleteId: string,
  weekNumber: number
): Promise<AthleteWeekData | null>
```

### Server Actions

```typescript
// src/lib/trainer/actions/copyWeek.ts
function copyWeek(
  athleteId: string,
  sourceWeek: number,
  targetWeek: number,
  empty: boolean
): Promise<{ weekNumber: number }>

// src/lib/trainer/actions/updateSets.ts
function updateSets(
  updates: Array<{ setId: string; reps?: number; weightKg?: number }>
): Promise<void>
```

### Shared Component

```typescript
// src/components/trainer/WeekTable.tsx
type WeekTableProps = {
  data: AthleteWeekData;
  mode: "edit" | "readonly";
  onDayClick?: (dayIndex: number) => void;
};
```

## Files to Create

**Routes:**
- `src/app/trainer/athletes/page.tsx`
- `src/app/trainer/athletes/[athleteId]/page.tsx`
- `src/app/week/page.tsx`

**Components:**
- `src/components/trainer/AthletesTable.tsx`
- `src/components/trainer/WeekTable.tsx`
- `src/components/trainer/CreateWeekDialog.tsx`

**Query functions:**
- `src/lib/trainer/getTrainerAthletes.ts`
- `src/lib/trainer/getAthleteWeek.ts`
- `src/lib/trainer/getLatestWeekNumber.ts`

**Server actions:**
- `src/lib/trainer/actions/copyWeek.ts`
- `src/lib/trainer/actions/updateSets.ts`

**Modify:**
- `src/components/ui/UserMenu.tsx` - Add role-based menu items

## Future Enhancements

- Bulk edit mode (select multiple sets, apply +2.5kg to all)
- Add/remove exercises from week
- Add/remove sets from exercises
- Reorder exercises
- Notes per exercise or day
- Exercise library browser for adding new exercises
