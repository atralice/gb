# Exercise Library Design

## Problem

Exercises are currently global with no ownership. Any trainer can create an exercise, and all trainers see all exercises. There's no curation, no library browsing page, and name conflicts are blocked by a global unique constraint.

## Decision: Copy Model

Two pools, fully isolated:

- **Global library** — curated by admins, read-only for trainers
- **Trainer library** — each trainer's own exercises, fully independent

Trainers never edit global exercises directly. Selecting a global exercise copies it into the trainer's library. From that point on the trainer owns their copy and can edit it freely.

## Data Model

Add fields to `Exercise`:

| Field | Type | Purpose |
|---|---|---|
| `ownerId` | `String?` | `null` = global (admin-managed). Non-null = trainer's personal exercise |
| `globalSourceId` | `String?` | Back-reference to the global exercise this was copied from. Enables "updated version available" later |

Constraints:
- Drop `@unique` on `name`
- Add `@@unique([name, ownerId])` — a trainer can't have two exercises with the same name; global library can't have two either
- `owner` relation to `User` (optional)
- `globalSource` self-relation to `Exercise` (optional)

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

## Search Behavior

When a trainer searches exercises (ExercisePicker or library page):

1. **Trainer's own exercises** (`ownerId = trainerId`) — shown first
2. **Global matches** (`ownerId = null`) — shown below with a "Global" badge

When a trainer selects a global exercise:
- A copy is created in their library (`ownerId = trainerId`, `globalSourceId = globalExercise.id`)
- The workout references the copy, not the global original

When a trainer selects one of their own exercises:
- Used directly, no copy needed

Name conflict on copy: If the trainer already has an exercise with that name (from a previous copy or manual creation), use the existing one instead of creating a duplicate.

## Trainer Library Page (`/trainer/exercises`)

- Shows only `ownerId = trainerId` exercises
- Search, filter by type (weighted/bodyweight/timed) and tags
- Edit: name, instructions, videoUrl, tags, exerciseType
- Create new exercises
- "Suggest to global" button — flags the exercise for admin review

## Admin Exercises Page (`/admin/exercises`)

- Manage global exercises (`ownerId = null`): create, edit, delete
- Review trainer suggestions: see the trainer's exercise, approve = copy into global library
- Merge duplicates

## Migration

1. Add `ownerId` (nullable) and `globalSourceId` (nullable) to `Exercise`
2. Drop `@unique` on `name`, add `@@unique([name, ownerId])`
3. All existing exercises become global (`ownerId = null`) — existing workout references keep working
4. Update `searchExercises` to accept `trainerId` and apply visibility rules
5. Update `createExercise` to accept `ownerId`

## Pages Summary

| Route | Role | Purpose |
|---|---|---|
| `/trainer/exercises` | trainer | Browse/search/edit own library |
| `/admin/exercises` | admin | Manage global library, review suggestions |
| ExercisePicker (component) | trainer | Inline search during workout editing, auto-copies global exercises |
