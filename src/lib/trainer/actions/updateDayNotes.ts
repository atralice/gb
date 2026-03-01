"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateDayNotes(
  dayId: string,
  notes: string
): Promise<void> {
  await prisma.workoutDay.update({
    where: { id: dayId },
    data: { notes },
  });

  revalidatePath("/trainer/athletes");
}
