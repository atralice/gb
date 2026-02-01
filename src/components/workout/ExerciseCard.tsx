"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { useDoubleTap } from "@/hooks/useDoubleTap";
import SetPill from "./SetPill";
import { calculateVolumes, getSetColorClasses } from "@/lib/workouts/setColors";
import {
  upsertSetLog,
  upsertSetLogs,
} from "@/lib/workouts/actions/upsertSetLog";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";

type Block = NonNullable<WorkoutDayWithBlocks>["blocks"][number];
type Exercise = Block["exercises"][number]["exercise"];
type SetWithLog = Block["exercises"][number]["sets"][number];

type ExerciseCardProps = {
  exercise: Exercise;
  comment: string | null;
  sets: SetWithLog[];
  onExerciseTap: () => void;
  onSetDoubleTap: (
    set: SetWithLog,
    exerciseName: string,
    allSets: SetWithLog[]
  ) => void;
};

export default function ExerciseCard({
  exercise,
  comment,
  sets,
  onExerciseTap,
  onSetDoubleTap,
}: ExerciseCardProps) {
  const [isPending, startTransition] = useTransition();

  // Initialize from server state
  const initialCompleted = new Set(
    sets.filter((s) => s.log?.completed).map((s) => s.id)
  );
  const [completedSets, setCompletedSets] =
    useState<Set<string>>(initialCompleted);

  const { volumes, minVolume, maxVolume } = calculateVolumes(sets);
  const allCompleted = completedSets.size === sets.length && sets.length > 0;

  const handleSetTap = (tappedSet: SetWithLog, index: number) => {
    const isCompleted = completedSets.has(tappedSet.id);

    if (isCompleted) {
      // Uncomplete this set only
      setCompletedSets((prev) => {
        const next = new Set(prev);
        next.delete(tappedSet.id);
        return next;
      });
      startTransition(() => {
        void upsertSetLog({ setId: tappedSet.id, completed: false });
      });
    } else {
      // Complete this set and all previous sets with default values
      const setsToComplete = sets.slice(0, index + 1);
      const setIdsToComplete = setsToComplete.map((s) => s.id);

      setCompletedSets((prev) => {
        const next = new Set(prev);
        setIdsToComplete.forEach((id) => next.add(id));
        return next;
      });

      startTransition(() => {
        void upsertSetLogs({ setIds: setIdsToComplete, completed: true });
      });
    }
  };

  const handleToggleAll = () => {
    const allSetIds = sets.map((s) => s.id);

    if (allCompleted) {
      // Uncomplete all sets
      setCompletedSets(new Set());
      startTransition(() => {
        void upsertSetLogs({ setIds: allSetIds, completed: false });
      });
    } else {
      // Complete all sets
      setCompletedSets(new Set(allSetIds));
      startTransition(() => {
        void upsertSetLogs({ setIds: allSetIds, completed: true });
      });
    }
  };

  const { handleTap: handleCardTap } = useDoubleTap({
    onDoubleTap: handleToggleAll,
  });

  return (
    <div
      onClick={handleCardTap}
      className={cn(
        "cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300",
        allCompleted
          ? "border-emerald-300 bg-emerald-50/30"
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleAll();
          }}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            allCompleted
              ? "border-emerald-500 bg-emerald-500 hover:bg-emerald-600"
              : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
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
        </button>
      </div>

      {comment && (
        <p className="mb-3 text-xs leading-relaxed text-slate-500">{comment}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {sets.map((set, index) => {
          const volume = volumes[index] ?? 0;
          const colorClasses = getSetColorClasses(volume, minVolume, maxVolume);

          return (
            <SetPill
              key={set.id}
              reps={set.reps}
              weightKg={set.weightKg}
              durationSeconds={set.durationSeconds}
              repsPerSide={set.repsPerSide}
              completed={completedSets.has(set.id)}
              colorClasses={colorClasses}
              onTap={() => handleSetTap(set, index)}
              onDoubleTap={() => onSetDoubleTap(set, exercise.name, sets)}
            />
          );
        })}
      </div>
    </div>
  );
}
