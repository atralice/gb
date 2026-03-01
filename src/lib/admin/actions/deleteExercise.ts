"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteExercise(id: string): Promise<void> {
  await prisma.exercise.delete({
    where: { id },
  });

  revalidatePath("/admin/exercises");
}
