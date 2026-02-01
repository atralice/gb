"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import SetPill from "./SetPill";
import { calculateVolumes, getSetColorClasses } from "@/lib/workouts/setColors";
import type { Set as PrismaSet } from "@prisma/client";

type Exercise = {
  id: string;
  name: string;
  instructions: string | null;
  videoUrl: string | null;
  tags: string[];
};

type SetForDisplay = Pick<
  PrismaSet,
  "id" | "setIndex" | "reps" | "weightKg" | "repsPerSide" | "durationSeconds"
>;

type ExerciseCardProps = {
  exercise: Exercise;
  comment: string | null;
  sets: SetForDisplay[];
  onExerciseTap: () => void;
  onSetDoubleTap: (set: SetForDisplay, exerciseName: string) => void;
};

export default function ExerciseCard({
  exercise,
  comment,
  sets,
  onExerciseTap,
  onSetDoubleTap,
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
        allCompleted
          ? "border-emerald-300 bg-emerald-50/30"
          : "border-slate-100"
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
              onDoubleTap={() => onSetDoubleTap(set, exercise.name)}
            />
          );
        })}
      </div>
    </div>
  );
}
