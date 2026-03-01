"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function reorderExercise(
  exerciseAId: string,
  exerciseBId: string
): Promise<void> {
  const [exerciseA, exerciseB] = await Promise.all([
    prisma.workoutBlockExercise.findUniqueOrThrow({
      where: { id: exerciseAId },
    }),
    prisma.workoutBlockExercise.findUniqueOrThrow({
      where: { id: exerciseBId },
    }),
  ]);

  // Swap orders in a transaction
  // Use a temporary order to avoid unique constraint violation on [workoutBlockId, order]
  const tempOrder = -1;

  await prisma.$transaction([
    prisma.workoutBlockExercise.update({
      where: { id: exerciseAId },
      data: { order: tempOrder },
    }),
    prisma.workoutBlockExercise.update({
      where: { id: exerciseBId },
      data: { order: exerciseA.order },
    }),
    prisma.workoutBlockExercise.update({
      where: { id: exerciseAId },
      data: { order: exerciseB.order },
    }),
  ]);

  revalidatePath("/trainer/athletes");
}
