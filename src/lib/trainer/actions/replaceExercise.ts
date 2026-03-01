"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function replaceExercise(
  workoutBlockExerciseId: string,
  newExerciseId: string
): Promise<void> {
  await prisma.workoutBlockExercise.update({
    where: { id: workoutBlockExerciseId },
    data: { exerciseId: newExerciseId },
  });

  revalidatePath("/trainer/athletes");
}
