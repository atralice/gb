"use client";

import ExerciseCard from "./ExerciseCard";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";

type Block = NonNullable<WorkoutDayWithBlocks>["blocks"][number];

type BlockContentProps = {
  block: Block;
  onExerciseTap: (exercise: Block["exercises"][number]) => void;
};

export default function BlockContent({
  block,
  onExerciseTap,
}: BlockContentProps) {
  return (
    <div className="p-4">
      {/* Block comment */}
      {block.comment && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
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
          <p className="text-sm text-amber-800">{block.comment}</p>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {block.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise.exercise}
            comment={exercise.comment}
            sets={exercise.sets}
            onExerciseTap={() => onExerciseTap(exercise)}
          />
        ))}
      </div>

      {/* Interaction hint */}
      <p className="mt-6 text-center text-xs text-slate-400">
        Tap set para completar · Doble tap para editar
      </p>
    </div>
  );
}
