import { BlockType } from "@/types/workout";
import type { WorkoutDayWithExercises } from "./getWorkoutDay";

type WorkoutDayExercise =
  NonNullable<WorkoutDayWithExercises>["exercises"][number];

type WorkoutDayBlockComment =
  NonNullable<WorkoutDayWithExercises>["blockComments"][number];

export function partitionExercises(
  exercises: WorkoutDayExercise[]
): Record<BlockType, WorkoutDayExercise[]> {
  return {
    [BlockType.warmup]: exercises.filter((ex) => ex.block === BlockType.warmup),
    [BlockType.a]: exercises.filter((ex) => ex.block === BlockType.a),
    [BlockType.b]: exercises.filter((ex) => ex.block === BlockType.b),
    [BlockType.c]: exercises.filter((ex) => ex.block === BlockType.c),
  };
}

export function partitionBlockComments(
  blockComments: WorkoutDayBlockComment[]
): Record<BlockType, string | undefined> {
  const result: Record<BlockType, string | undefined> = {
    [BlockType.warmup]: undefined,
    [BlockType.a]: undefined,
    [BlockType.b]: undefined,
    [BlockType.c]: undefined,
  };

  blockComments.forEach((bc) => {
    if (bc.block in result) {
      result[bc.block as BlockType] = bc.comment;
    }
  });

  return result;
}
