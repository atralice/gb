import { describe, test, expect } from "bun:test";
import { partitionExercises } from "../partition";
import { BlockType } from "@/types/workout";
import type { WorkoutDayWithExercises } from "../getWorkoutDay";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import workoutDayExerciseFactory from "test/helpers/factories/workoutDayExerciseFactory";
import { beforeEach } from "bun:test";
import truncateDb from "test/helpers/test-helpers";

type WorkoutDayExercise =
  NonNullable<WorkoutDayWithExercises>["exercises"][number];

function buildWorkoutDayExercise(
  block: BlockType,
  exerciseName: string,
  order: number = 1
): WorkoutDayExercise {
  const exercise = exerciseFactory.build({ name: exerciseName });
  const workoutDayExercise = workoutDayExerciseFactory.build({
    block,
    order,
    exerciseId: exercise.id,
  });

  return {
    ...workoutDayExercise,
    exercise: {
      id: exercise.id,
      name: exercise.name,
      videoUrl: exercise.videoUrl,
    },
    sets: [],
  };
}

describe("partitionExercises", () => {
  beforeEach(async () => {
    await truncateDb();
  });
  test("partitions exercises by block type", () => {
    const exercises: WorkoutDayExercise[] = [
      buildWorkoutDayExercise(BlockType.warmup, "Warmup Exercise", 1),
      buildWorkoutDayExercise(BlockType.a, "Block A Exercise", 1),
      buildWorkoutDayExercise(BlockType.b, "Block B Exercise", 1),
      buildWorkoutDayExercise(BlockType.c, "Block C Exercise", 1),
    ];

    const result = partitionExercises(exercises);

    expect(result[BlockType.warmup]).toHaveLength(1);
    expect(result[BlockType.warmup][0]?.exercise).toMatchObject({
      name: "Warmup Exercise",
    });

    expect(result[BlockType.a]).toHaveLength(1);
    expect(result[BlockType.a][0]?.exercise).toMatchObject({
      name: "Block A Exercise",
    });

    expect(result[BlockType.b]).toHaveLength(1);
    expect(result[BlockType.b][0]?.exercise).toMatchObject({
      name: "Block B Exercise",
    });

    expect(result[BlockType.c]).toHaveLength(1);
    expect(result[BlockType.c][0]?.exercise).toMatchObject({
      name: "Block C Exercise",
    });
  });

  test("handles multiple exercises in same block", () => {
    const exercises: WorkoutDayExercise[] = [
      buildWorkoutDayExercise(BlockType.a, "Exercise A1", 1),
      buildWorkoutDayExercise(BlockType.a, "Exercise A2", 2),
      buildWorkoutDayExercise(BlockType.a, "Exercise A3", 3),
    ];

    const result = partitionExercises(exercises);

    expect(result[BlockType.a]).toHaveLength(3);
    expect(result[BlockType.warmup]).toHaveLength(0);
    expect(result[BlockType.b]).toHaveLength(0);
    expect(result[BlockType.c]).toHaveLength(0);
  });

  test("handles empty array", () => {
    const exercises: WorkoutDayExercise[] = [];

    const result = partitionExercises(exercises);

    expect(result[BlockType.warmup]).toHaveLength(0);
    expect(result[BlockType.a]).toHaveLength(0);
    expect(result[BlockType.b]).toHaveLength(0);
    expect(result[BlockType.c]).toHaveLength(0);
  });

  test("returns all block types in result", () => {
    const exercises: WorkoutDayExercise[] = [
      buildWorkoutDayExercise(BlockType.a, "Exercise", 1),
    ];

    const result = partitionExercises(exercises);

    expect(result).toHaveProperty(BlockType.warmup);
    expect(result).toHaveProperty(BlockType.a);
    expect(result).toHaveProperty(BlockType.b);
    expect(result).toHaveProperty(BlockType.c);
    expect(Object.keys(result)).toHaveLength(4);
  });
});
