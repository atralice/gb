"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateExerciseComment(
  blockExerciseId: string,
  comment: string
): Promise<void> {
  await prisma.workoutBlockExercise.update({
    where: { id: blockExerciseId },
    data: { comment },
  });

  revalidatePath("/trainer/athletes");
}
