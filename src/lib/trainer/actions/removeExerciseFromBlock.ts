"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function removeExerciseFromBlock(
  workoutBlockExerciseId: string
): Promise<void> {
  // Sets are cascade-deleted by the Prisma schema (onDelete: Cascade)
  await prisma.workoutBlockExercise.delete({
    where: { id: workoutBlockExerciseId },
  });

  revalidatePath("/trainer/athletes");
}
