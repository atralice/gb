import ExerciseCard from "./ExerciseCard";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";

type Block = NonNullable<WorkoutDayWithBlocks>["blocks"][number];
type SetWithLog = Block["exercises"][number]["sets"][number];

type BlockContentProps = {
  block: Block;
  onExerciseTap: (exercise: Block["exercises"][number]) => void;
  onSetDoubleTap: (
    set: SetWithLog,
    exerciseName: string,
    allSets: SetWithLog[]
  ) => void;
};

export default function BlockContent({
  block,
  onExerciseTap,
  onSetDoubleTap,
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
        {block.exercises.map((exercise) => {
          // Include completed count in key to force remount when server data changes
          const completedCount = exercise.sets.filter(
            (s) => s.log?.completed
          ).length;
          return (
            <ExerciseCard
              key={`${exercise.id}-${completedCount}`}
              exercise={exercise.exercise}
              comment={exercise.comment}
              sets={exercise.sets}
              onExerciseTap={() => onExerciseTap(exercise)}
              onSetDoubleTap={onSetDoubleTap}
            />
          );
        })}
      </div>

      {/* Interaction hint */}
      <p className="mt-6 text-center text-xs text-slate-400">
        Tap set para completar · Doble tap para editar
      </p>
    </div>
  );
}
