"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addExerciseToBlock(
  blockId: string,
  exerciseId: string
): Promise<void> {
  // 1. Find existing exercises in the block to determine next order and series count
  const existingExercises = await prisma.workoutBlockExercise.findMany({
    where: { workoutBlockId: blockId },
    include: {
      sets: true,
    },
    orderBy: { order: "asc" },
  });

  const nextOrder =
    existingExercises.length > 0
      ? Math.max(...existingExercises.map((e) => e.order)) + 1
      : 1;

  // Determine series count from existing exercises, default 1 if empty block
  const firstExercise = existingExercises[0];
  const seriesCount = firstExercise ? firstExercise.sets.length : 1;

  // 2. Create the new WorkoutBlockExercise
  const newExercise = await prisma.workoutBlockExercise.create({
    data: {
      workoutBlockId: blockId,
      exerciseId: exerciseId,
      order: nextOrder,
    },
  });

  // 3. Create empty sets matching the block's current series count
  const setOperations = Array.from({ length: seriesCount }, (_, i) =>
    prisma.set.create({
      data: {
        workoutBlockExerciseId: newExercise.id,
        setIndex: i + 1,
        reps: null,
        weightKg: null,
        repsPerSide: false,
      },
    })
  );

  if (setOperations.length > 0) {
    await prisma.$transaction(setOperations);
  }

  revalidatePath("/trainer/athletes");
}
