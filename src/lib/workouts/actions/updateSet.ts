"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import getUser from "@/lib/auth/getUser";
import { AuthorizationError } from "@/types/errors";

const UpdateSetSchema = z.object({
  setId: z.string().uuid(),
  reps: z.number().int().positive().nullable(),
  weightKg: z.number().positive().nullable(),
  durationSeconds: z.number().int().positive().nullable(),
  repsPerSide: z.boolean(),
});

export async function updateSet(input: z.infer<typeof UpdateSetSchema>) {
  const validated = UpdateSetSchema.parse(input);

  // Get current user and verify authorization
  const user = await getUser();
  if (!user) {
    throw new AuthorizationError("Must be authenticated");
  }

  // Verify ownership before updating
  const set = await prisma.set.findUniqueOrThrow({
    where: { id: validated.setId },
    include: {
      workoutBlockExercise: {
        include: {
          workoutBlock: {
            include: {
              workoutDay: { select: { athleteId: true } },
            },
          },
        },
      },
    },
  });

  if (set.workoutBlockExercise.workoutBlock.workoutDay.athleteId !== user.id) {
    throw new AuthorizationError("Cannot modify sets for other athletes");
  }

  const updatedSet = await prisma.set.update({
    where: { id: validated.setId },
    data: {
      reps: validated.reps,
      weightKg: validated.weightKg,
      durationSeconds: validated.durationSeconds,
      repsPerSide: validated.repsPerSide,
    },
  });

  return updatedSet;
}
