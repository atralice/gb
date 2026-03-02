"use server";

import type { ExerciseType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function bulkUpdateExerciseType(
  exerciseIds: string[],
  exerciseType: ExerciseType
): Promise<void> {
  await prisma.exercise.updateMany({
    where: { id: { in: exerciseIds } },
    data: { exerciseType },
  });

  revalidatePath("/trainer", "layout");
}
