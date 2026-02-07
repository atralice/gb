"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type SetUpdate = {
  setId: string;
  reps?: number;
  weightKg?: number;
};

export async function updateSets(updates: SetUpdate[]): Promise<void> {
  await prisma.$transaction(
    updates.map((update) =>
      prisma.set.update({
        where: { id: update.setId },
        data: {
          ...(update.reps !== undefined && { reps: update.reps }),
          ...(update.weightKg !== undefined && { weightKg: update.weightKg }),
        },
      })
    )
  );

  revalidatePath("/trainer/athletes");
}
