"use client";

import EditableExerciseSetPills from "./EditableExerciseSetPills";
import EditableExerciseComment from "./EditableExerciseComment";
import type { WorkoutBlockExercise, Set } from "@prisma/client";

type WorkoutBlockExerciseWithRelations = WorkoutBlockExercise & {
  exercise: { id: string; name: string; videoUrl: string | null };
  sets: Array<
    Pick<
      Set,
      | "id"
      | "setIndex"
      | "reps"
      | "weightKg"
      | "repsPerSide"
      | "durationSeconds"
    >
  >;
};

type EditableExerciseCardProps = {
  exercise: WorkoutBlockExerciseWithRelations;
};

const EditableExerciseCard = ({ exercise }: EditableExerciseCardProps) => {
  return (
    <div className="px-2 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-tight">
            {exercise.exercise.name}
          </p>
          <EditableExerciseComment
            workoutBlockExerciseId={exercise.id}
            initialComment={exercise.comment}
          />
        </div>
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <EditableExerciseSetPills sets={exercise.sets} />

      {exercise.variants && exercise.variants.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {exercise.variants.map((variant: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
            >
              {variant.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {exercise.exercise.videoUrl && (
        <a
          href={exercise.exercise.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-[10px] font-medium text-indigo-600 hover:text-indigo-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="mr-1 h-3 w-3"
            fill="currentColor"
          >
            <path d="M21.8 8.001a2.75 2.75 0 0 0-1.94-1.949C18.26 5.5 12 5.5 12 5.5s-6.26 0-7.86.552A2.75 2.75 0 0 0 2.2 8.001C1.65 9.61 1.65 12 1.65 12s0 2.39.55 3.999a2.75 2.75 0 0 0 1.94 1.949C5.74 18.5 12 18.5 12 18.5s6.26 0 7.86-.552a2.75 2.75 0 0 0 1.94-1.949C22.35 14.39 22.35 12 22.35 12s0-2.39-.55-3.999ZM10.5 14.75v-5.5L15 12l-4.5 2.75Z" />
          </svg>
          Ver video
        </a>
      )}
    </div>
  );
};

export default EditableExerciseCard;
