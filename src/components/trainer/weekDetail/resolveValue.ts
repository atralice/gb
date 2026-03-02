// src/components/trainer/weekDetail/resolveValue.ts
import type { AthleteWeekSet } from "@/lib/trainer/getAthleteWeek";

export type SetField = "weightKg" | "reps" | "durationSeconds";

export type EditedSet = {
  setId: string;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
};

export type SetInputConfig = {
  field: SetField;
  unit: "kg" | "reps" | "s";
  step: number;
  min: number;
  max: number;
  defaultValue: number;
};

export const exerciseInputs: Record<
  "weighted" | "bodyweight" | "timed",
  SetInputConfig[]
> = {
  weighted: [
    {
      field: "weightKg",
      unit: "kg",
      step: 2.5,
      min: 0,
      max: 500,
      defaultValue: 20,
    },
    {
      field: "reps",
      unit: "reps",
      step: 1,
      min: 1,
      max: 100,
      defaultValue: 10,
    },
  ],
  bodyweight: [
    {
      field: "reps",
      unit: "reps",
      step: 1,
      min: 1,
      max: 100,
      defaultValue: 10,
    },
  ],
  timed: [
    {
      field: "durationSeconds",
      unit: "s",
      step: 5,
      min: 1,
      max: 600,
      defaultValue: 30,
    },
  ],
};

export function resolveValue(
  sets: AthleteWeekSet[],
  setIndex: number,
  field: SetField,
  editedSets: Map<string, EditedSet>,
  fallbackDefault: number
): number {
  const set = sets[setIndex];
  if (!set) return fallbackDefault;
  // 1. Check edited value
  const edited = editedSets.get(set.id);
  if (edited) {
    const v = edited[field];
    if (v !== undefined) return v ?? fallbackDefault;
  }
  // 2. Check set's own value
  const ownValue = set[field];
  if (ownValue !== null && ownValue !== undefined) return ownValue;
  // 3. Copy from previous set's persisted value (not edited — avoids cascade)
  for (let i = setIndex - 1; i >= 0; i--) {
    const prev = sets[i];
    if (!prev) continue;
    const prevValue = prev[field];
    if (prevValue !== null && prevValue !== undefined) return prevValue;
  }
  // 4. Type default
  return fallbackDefault;
}
