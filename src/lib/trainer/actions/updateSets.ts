"use server";

import prisma from "@/lib/prisma";

type SetUpdate = {
  setId: string;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
};

export async function updateSets(updates: SetUpdate[]): Promise<void> {
  await prisma.$transaction(
    updates.map((update) =>
      prisma.set.update({
        where: { id: update.setId },
        data: {
          ...(update.reps !== undefined && { reps: update.reps }),
          ...(update.weightKg !== undefined && { weightKg: update.weightKg }),
          ...(update.durationSeconds !== undefined && {
            durationSeconds: update.durationSeconds,
          }),
        },
      })
    )
  );
}
