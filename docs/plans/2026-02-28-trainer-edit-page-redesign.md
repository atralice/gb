# Trainer Edit Page Redesign

## Summary

Enhance the trainer's week editing experience with 6 improvements: dedicated edit page route, full exercise CRUD, better inputs with steppers, editable notes at all levels, fix duplicate day labels, and make duration fields editable.

## 1. Routing & Page Structure

**Current**: `/trainer/athletes/[athleteId]?week=N` toggles between overview and detail on the same page.

**New**:
- `/trainer/athletes/[athleteId]` — Overview only (WeekOverviewTable)
- `/trainer/athletes/[athleteId]/week/[weekNumber]` — Dedicated edit page

Changes:
- Create `src/app/trainer/athletes/[athleteId]/week/[weekNumber]/page.tsx` — server component fetching via `getAthleteWeek`
- Remove `?week` conditional from overview page — it only renders WeekOverviewTable
- Update WeekOverviewTable links to navigate to `/trainer/athletes/{id}/week/{weekNumber}`
- Reuse existing PageShell, WeekNav, BackArrow components

## 2. SetInput Component

New reusable input component that adapts to set type.

| Type     | Unit   | Step  | Range   |
|----------|--------|-------|---------|
| Weight   | `kg`   | 2.5   | 0–500   |
| Reps     | `reps` | 1     | 1–100   |
| Duration | `s`    | 5     | 1–600   |

Visual layout per input:
```
  [-]  [  60  ] kg  [+]
```

- Stepper buttons on each side
- Unit label after input
- Input always directly editable (numeric keyboard on mobile)
- Compact sizing for table cells
- Touch-friendly stepper interaction

API:
```tsx
<SetInput value={60} unit="kg" step={2.5} min={0} max={500} onChange={(val) => ...} />
```

Replaces current raw `<input>` elements in WeekDetailTable. Shows appropriate SetInput fields based on set field presence (weight, reps, duration).

## 3. Exercise CRUD

Full add/remove/reorder/swap for exercises within blocks.

### Add exercise to block
- `+ Add exercise` button at bottom of each block
- Opens combobox (cmdk) with search over Exercise table
- "Create new exercise" option at bottom if no match
- Inline create asks for exercise name only
- New exercise added at end of block with next order value
- Sets auto-created matching block's current series count (empty values)

### Remove exercise
- Menu button (three dots) on each exercise row
- Confirm before deleting (exercise + its sets removed)

### Swap/Replace exercise
- Menu button → "Replace exercise"
- Opens same combobox to pick replacement
- Keeps existing sets structure, changes exerciseId

### Reorder exercises
- Up/down arrows in exercise menu
- Swaps order values between adjacent exercises

### New server actions
- `addExerciseToBlock` — creates WorkoutBlockExercise + empty sets
- `removeExerciseFromBlock` — deletes exercise + its sets
- `replaceExercise` — updates exerciseId on WorkoutBlockExercise
- `reorderExercise` — swaps order between two exercises in a block

## 4. Editable Notes

Three levels of notes, all editable inline with auto-save on blur.

### Exercise comment (WorkoutBlockExercise.comment)
- Clickable note icon next to exercise name → expands inline text input below name
- If empty, show faded "+ note" link
- New `updateExerciseComment` server action

### Block comment (WorkoutBlock.comment)
- Editable text field below block header label
- If empty, show "+ note" link
- New `updateBlockComment` server action

### Day notes (WorkoutDay.notes)
- Editable text field below day header
- If empty, show "+ note" link
- New `updateDayNotes` server action

UX: Click to edit → text area → blur or Enter saves → optimistic update.

## 5. Day Header Fix

**Problem**: Header renders "DÍA {dayIndex}" then "{day.label}" — if label is "Día 1", shows "DÍA 1 Día 1".

**Fix**: Render "Día {dayIndex}", then if day.label exists and doesn't match pattern "Día {N}" / "Dia {N}", show as "— {label}" suffix.

Result: `Día 1 — Pierna` or just `Día 1` if label is redundant/empty.

## 6. Duration Editing Fix

**Problem**: `durationSeconds` displayed as read-only "{value}s" text.

**Fix**: Replace with SetInput component (unit="s", step=5). Update `updateSets` server action to accept `durationSeconds` in SetUpdate type.

## New Files

- `src/app/trainer/athletes/[athleteId]/week/[weekNumber]/page.tsx`
- `src/components/trainer/SetInput.tsx`
- `src/components/trainer/ExercisePicker.tsx` (combobox for search + create)
- `src/components/trainer/ExerciseMenu.tsx` (dropdown for swap/remove/reorder)
- `src/components/trainer/InlineNote.tsx` (click-to-edit note component)
- `src/lib/trainer/actions/addExerciseToBlock.ts`
- `src/lib/trainer/actions/removeExerciseFromBlock.ts`
- `src/lib/trainer/actions/replaceExercise.ts`
- `src/lib/trainer/actions/reorderExercise.ts`
- `src/lib/trainer/actions/updateExerciseComment.ts`
- `src/lib/trainer/actions/updateBlockComment.ts`
- `src/lib/trainer/actions/updateDayNotes.ts`

## Modified Files

- `src/app/trainer/athletes/[athleteId]/page.tsx` — remove ?week conditional
- `src/components/trainer/WeekDetailTable.tsx` — integrate SetInput, ExerciseMenu, InlineNote, fix day header
- `src/components/trainer/WeekOverviewTable.tsx` — update links to new route
- `src/lib/trainer/actions/updateSets.ts` — add durationSeconds to SetUpdate type
