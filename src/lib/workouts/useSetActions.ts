"use client";

import { useTransition } from "react";
import { logSet, logSets, skipSet, skipSets } from "./actions/logSet";

type SetBase = {
  id: string;
  completed: boolean;
  skipped: boolean;
};

type SetValues = {
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
};

/**
 * Standalone function to complete a set with custom values AND all previous incomplete sets.
 * Used by the edit drawer where we don't have the full hook context.
 */
export async function completeSetWithValues(
  sets: SetBase[],
  setId: string,
  values: SetValues
): Promise<void> {
  const setIndex = sets.findIndex((s) => s.id === setId);
  const previousSetIds = sets
    .slice(0, setIndex)
    .filter((s) => !s.completed)
    .map((s) => s.id);

  await Promise.all([
    logSet({
      setId,
      completed: true,
      actualReps: values.reps ?? null,
      actualWeightKg: values.weightKg ?? null,
      actualDurationSeconds: values.durationSeconds ?? null,
    }),
    previousSetIds.length > 0
      ? logSets({ setIds: previousSetIds, completed: true })
      : Promise.resolve(),
  ]);
}

/**
 * Hook for managing set completion/skip actions.
 * Consolidates all set state mutations in one place.
 */
export function useSetActions<T extends SetBase>(sets: T[]) {
  const [isPending, startTransition] = useTransition();

  /**
   * Complete a single set, optionally with custom values.
   * Does NOT auto-complete previous sets.
   */
  const completeSet = (setId: string, values?: SetValues): Promise<void> => {
    return logSet({
      setId,
      completed: true,
      actualReps: values?.reps ?? null,
      actualWeightKg: values?.weightKg ?? null,
      actualDurationSeconds: values?.durationSeconds ?? null,
    });
  };

  /**
   * Uncomplete a single set.
   */
  const uncompleteSet = (setId: string): Promise<void> => {
    return logSet({ setId, completed: false });
  };

  /**
   * Complete a set and all previous non-skipped, non-completed sets.
   * This is the typical "tap to complete" behavior.
   */
  const completeSetAndPrevious = (
    setIndex: number,
    skippedIds: Set<string>,
    completedIds: Set<string>
  ): { setIds: string[] } => {
    const setsToComplete = sets
      .slice(0, setIndex + 1)
      .filter((s) => !skippedIds.has(s.id) && !completedIds.has(s.id));
    const setIds = setsToComplete.map((s) => s.id);

    if (setIds.length > 0) {
      startTransition(() => {
        void logSets({ setIds, completed: true });
      });
    }

    return { setIds };
  };

  /**
   * Complete a set with custom values AND all previous incomplete sets.
   * Used by the edit drawer.
   */
  const completeSetWithValuesAndPrevious = async (
    setId: string,
    setIndex: number,
    values: SetValues
  ): Promise<void> => {
    const previousSetIds = sets
      .slice(0, setIndex)
      .filter((s) => !s.completed)
      .map((s) => s.id);

    await Promise.all([
      logSet({
        setId,
        completed: true,
        actualReps: values.reps ?? null,
        actualWeightKg: values.weightKg ?? null,
        actualDurationSeconds: values.durationSeconds ?? null,
      }),
      previousSetIds.length > 0
        ? logSets({ setIds: previousSetIds, completed: true })
        : Promise.resolve(),
    ]);
  };

  /**
   * Skip or unskip a single set.
   * Skipping also uncompletes the set.
   */
  const toggleSkipSet = (setId: string, currentlySkipped: boolean) => {
    startTransition(() => {
      void skipSet({ setId, skipped: !currentlySkipped });
    });
    return !currentlySkipped;
  };

  /**
   * Complete all sets in the exercise.
   */
  const completeAllSets = () => {
    const allSetIds = sets.map((s) => s.id);
    startTransition(() => {
      void logSets({ setIds: allSetIds, completed: true });
    });
    return allSetIds;
  };

  /**
   * Reset all sets (uncomplete and unskip).
   */
  const resetAllSets = () => {
    const allSetIds = sets.map((s) => s.id);
    startTransition(() => {
      void Promise.all([
        logSets({ setIds: allSetIds, completed: false }),
        skipSets({ setIds: allSetIds, skipped: false }),
      ]);
    });
    return allSetIds;
  };

  /**
   * Skip all sets.
   */
  const skipAllSets = () => {
    const allSetIds = sets.map((s) => s.id);
    startTransition(() => {
      void skipSets({ setIds: allSetIds, skipped: true });
    });
    return allSetIds;
  };

  /**
   * Unskip all sets.
   */
  const unskipAllSets = () => {
    const allSetIds = sets.map((s) => s.id);
    startTransition(() => {
      void skipSets({ setIds: allSetIds, skipped: false });
    });
    return allSetIds;
  };

  return {
    isPending,
    startTransition,
    // Single set actions
    completeSet,
    uncompleteSet,
    toggleSkipSet,
    // Batch actions
    completeSetAndPrevious,
    completeSetWithValuesAndPrevious,
    completeAllSets,
    resetAllSets,
    skipAllSets,
    unskipAllSets,
  };
}
