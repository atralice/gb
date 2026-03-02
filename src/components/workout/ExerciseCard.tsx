"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import SetPill from "./SetPill";
import type { SetStatus } from "./SetPill";
import Spinner from "@/components/ui/Spinner";
import { calculateVolumes, getSetColorClasses } from "@/lib/workouts/setColors";
import { useSetActions } from "@/lib/workouts/useSetActions";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";
import type { ExerciseType } from "@prisma/client";

const LONG_PRESS_THRESHOLD = 500;

type Block = NonNullable<WorkoutDayWithBlocks>["blocks"][number];
type Exercise = Block["exercises"][number]["exercise"];
type SetWithLog = Block["exercises"][number]["sets"][number];

type ExerciseStatus = "none" | "allCompleted" | "allSkipped" | "mixedDone";

function deriveExerciseStatus(
  sets: SetWithLog[],
  completedSets: Set<string>,
  skippedSets: Set<string>
): ExerciseStatus {
  if (sets.length === 0) return "none";
  const allCompleted = completedSets.size === sets.length;
  const allSkipped = skippedSets.size === sets.length;
  const allDone = sets.every(
    (s) => completedSets.has(s.id) || skippedSets.has(s.id)
  );
  if (allCompleted) return "allCompleted";
  if (allSkipped) return "allSkipped";
  if (allDone) return "mixedDone";
  return "none";
}

type ExerciseCardProps = {
  exercise: Exercise;
  comment: string | null;
  sets: SetWithLog[];
  onExerciseTap: () => void;
  onSetDoubleTap: (
    set: SetWithLog,
    exerciseName: string,
    allSets: SetWithLog[],
    exerciseType: ExerciseType
  ) => void;
};

export default function ExerciseCard({
  exercise,
  comment,
  sets,
  onExerciseTap,
  onSetDoubleTap,
}: ExerciseCardProps) {
  // Initialize optimistic state from server state
  const initialCompleted = new Set(
    sets.filter((s) => s.completed).map((s) => s.id)
  );
  const initialSkipped = new Set(
    sets.filter((s) => s.skipped).map((s) => s.id)
  );
  const [completedSets, setCompletedSets] =
    useState<Set<string>>(initialCompleted);
  const [skippedSets, setSkippedSets] = useState<Set<string>>(initialSkipped);

  // Use centralized set actions
  const {
    isPending,
    startTransition,
    completeSet,
    uncompleteSet,
    toggleSkipSet,
    completeSetAndPrevious,
    completeAllSets,
    resetAllSets,
    skipAllSets,
    unskipAllSets,
  } = useSetActions(sets);

  const { volumes, minVolume, maxVolume } = calculateVolumes(sets);

  // Derived exercise status
  const exerciseStatus = deriveExerciseStatus(sets, completedSets, skippedSets);

  const handleSetTap = (tappedSet: SetWithLog, index: number) => {
    const isCompleted = completedSets.has(tappedSet.id);
    const isSkipped = skippedSets.has(tappedSet.id);

    if (isSkipped) {
      // Unskip and complete
      setSkippedSets((prev) => {
        const next = new Set(prev);
        next.delete(tappedSet.id);
        return next;
      });
      setCompletedSets((prev) => {
        const next = new Set(prev);
        next.add(tappedSet.id);
        return next;
      });
      startTransition(() => {
        void completeSet(tappedSet.id);
      });
      return;
    }

    if (isCompleted) {
      // Uncomplete this set only
      setCompletedSets((prev) => {
        const next = new Set(prev);
        next.delete(tappedSet.id);
        return next;
      });
      startTransition(() => {
        void uncompleteSet(tappedSet.id);
      });
    } else {
      // Complete this set and all previous non-skipped sets (optimistic update)
      const setsToComplete = sets
        .slice(0, index + 1)
        .filter((s) => !skippedSets.has(s.id) && !completedSets.has(s.id));
      const setIdsToComplete = setsToComplete.map((s) => s.id);

      setCompletedSets((prev) => {
        const next = new Set(prev);
        setIdsToComplete.forEach((id) => next.add(id));
        return next;
      });

      completeSetAndPrevious(index, skippedSets, completedSets);
    }
  };

  const handleSetLongPress = (tappedSet: SetWithLog) => {
    const isSkipped = skippedSets.has(tappedSet.id);

    if (isSkipped) {
      setSkippedSets((prev) => {
        const next = new Set(prev);
        next.delete(tappedSet.id);
        return next;
      });
    } else {
      setSkippedSets((prev) => {
        const next = new Set(prev);
        next.add(tappedSet.id);
        return next;
      });
      setCompletedSets((prev) => {
        const next = new Set(prev);
        next.delete(tappedSet.id);
        return next;
      });
    }
    toggleSkipSet(tappedSet.id, isSkipped);
  };

  const handleToggleAll = useCallback(() => {
    if (exerciseStatus !== "none") {
      setCompletedSets(new Set());
      setSkippedSets(new Set());
      resetAllSets();
    } else {
      setCompletedSets(new Set(sets.map((s) => s.id)));
      setSkippedSets(new Set());
      completeAllSets();
    }
  }, [sets, exerciseStatus, resetAllSets, completeAllSets]);

  const handleSkipAll = useCallback(() => {
    if (exerciseStatus === "allSkipped") {
      setSkippedSets(new Set());
      unskipAllSets();
    } else {
      setSkippedSets(new Set(sets.map((s) => s.id)));
      setCompletedSets(new Set());
      skipAllSets();
    }
  }, [sets, exerciseStatus, unskipAllSets, skipAllSets]);

  // Long press handling for the checkbox button
  const btnLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnIsLongPressRef = useRef(false);

  const handleBtnTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      btnIsLongPressRef.current = false;

      btnLongPressRef.current = setTimeout(() => {
        btnIsLongPressRef.current = true;
        handleSkipAll();
      }, LONG_PRESS_THRESHOLD);
    },
    [handleSkipAll]
  );

  const handleBtnTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault(); // Prevent click event from firing

      if (btnLongPressRef.current) {
        clearTimeout(btnLongPressRef.current);
        btnLongPressRef.current = null;
      }

      // If it was a long press, don't trigger toggle
      if (btnIsLongPressRef.current) {
        btnIsLongPressRef.current = false;
        return;
      }

      // Regular tap - toggle all
      handleToggleAll();
    },
    [handleToggleAll]
  );

  const handleBtnTouchCancel = useCallback(() => {
    if (btnLongPressRef.current) {
      clearTimeout(btnLongPressRef.current);
      btnLongPressRef.current = null;
    }
  }, []);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300",
        exerciseStatus === "allCompleted"
          ? "border-emerald-300 bg-emerald-50/30"
          : exerciseStatus === "allSkipped"
            ? "border-slate-200 bg-slate-50/50"
            : exerciseStatus === "mixedDone"
              ? "border-slate-300 bg-slate-50/30"
              : "border-slate-100",
        isPending && "opacity-70"
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExerciseTap();
          }}
          className="group min-w-0 flex-1 text-left"
        >
          <h3
            className={cn(
              "text-base font-semibold leading-tight transition-colors group-hover:text-blue-600",
              exerciseStatus === "allCompleted"
                ? "text-emerald-700"
                : exerciseStatus === "allSkipped" ||
                    exerciseStatus === "mixedDone"
                  ? "text-slate-500"
                  : "text-slate-800"
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

        <button
          onTouchStart={handleBtnTouchStart}
          onTouchEnd={handleBtnTouchEnd}
          onTouchCancel={handleBtnTouchCancel}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleAll();
          }}
          disabled={isPending}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            exerciseStatus === "allCompleted"
              ? "border-emerald-500 bg-emerald-500 hover:bg-emerald-600"
              : exerciseStatus === "allSkipped" ||
                  exerciseStatus === "mixedDone"
                ? "border-slate-400 bg-slate-400 hover:bg-slate-500"
                : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
            isPending && "cursor-wait"
          )}
        >
          {isPending ? (
            <Spinner
              size="sm"
              className={
                exerciseStatus !== "none" ? "text-white" : "text-slate-400"
              }
            />
          ) : exerciseStatus === "allCompleted" ? (
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
          ) : exerciseStatus === "allSkipped" ? (
            <svg
              className="h-3.5 w-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          ) : exerciseStatus === "mixedDone" ? (
            // Horizontal line to indicate "done but mixed"
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          ) : null}
        </button>
      </div>

      {comment && (
        <p className="mb-3 text-xs leading-relaxed text-slate-500">{comment}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {sets.map((set, index) => {
          const volume = volumes[index] ?? 0;
          const colorClasses = getSetColorClasses(volume, minVolume, maxVolume);

          // Use logged values if they exist, otherwise fall back to prescription
          const displayReps = set.actualReps ?? set.reps;
          const displayWeight = set.actualWeightKg ?? set.weightKg;
          const displayDuration =
            set.actualDurationSeconds ?? set.durationSeconds;

          const setStatus: SetStatus = skippedSets.has(set.id)
            ? "skipped"
            : completedSets.has(set.id)
              ? "completed"
              : "pending";

          return (
            <SetPill
              key={set.id}
              reps={displayReps}
              weightKg={displayWeight}
              durationSeconds={displayDuration}
              repsPerSide={set.repsPerSide}
              exerciseType={exercise.exerciseType}
              status={setStatus}
              colorClasses={colorClasses}
              onTap={() => handleSetTap(set, index)}
              onDoubleTap={() =>
                onSetDoubleTap(set, exercise.name, sets, exercise.exerciseType)
              }
              onLongPress={() => handleSetLongPress(set)}
            />
          );
        })}
      </div>
    </div>
  );
}
