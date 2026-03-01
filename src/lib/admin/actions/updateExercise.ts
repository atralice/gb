"use server";

import type { ExerciseType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateExercise(
  id: string,
  data: {
    name?: string;
    exerciseType?: ExerciseType;
    instructions?: string | null;
    videoUrl?: string | null;
    tags?: string[];
  }
): Promise<void> {
  await prisma.exercise.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/exercises");
}
