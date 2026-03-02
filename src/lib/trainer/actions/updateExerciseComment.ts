"use server";

import prisma from "@/lib/prisma";

export async function updateExerciseComment(
  blockExerciseId: string,
  comment: string
): Promise<void> {
  await prisma.workoutBlockExercise.update({
    where: { id: blockExerciseId },
    data: { comment },
  });
}
