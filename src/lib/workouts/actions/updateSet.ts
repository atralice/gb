"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const UpdateSetSchema = z.object({
  setId: z.string().uuid(),
  reps: z.number().int().positive().nullable(),
  weightKg: z.number().positive().nullable(),
  repsPerSide: z.boolean(),
});

export async function updateSet(input: z.infer<typeof UpdateSetSchema>) {
  const validated = UpdateSetSchema.parse(input);

  const set = await prisma.set.update({
    where: { id: validated.setId },
    data: {
      reps: validated.reps,
      weightKg: validated.weightKg,
      repsPerSide: validated.repsPerSide,
    },
  });

  return set;
}
