"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import getUser from "@/lib/auth/getUser";
import { AuthorizationError } from "@/types/errors";

const UpdateExerciseCommentSchema = z.object({
  workoutBlockExerciseId: z.string().uuid(),
  comment: z.string().nullable(),
});

export async function updateExerciseComment(
  input: z.infer<typeof UpdateExerciseCommentSchema>
) {
  const validated = UpdateExerciseCommentSchema.parse(input);

  // Get current user and verify authorization
  const user = await getUser();
  if (!user) {
    throw new AuthorizationError("Must be authenticated");
  }

  // Verify ownership before updating
  const exercise = await prisma.workoutBlockExercise.findUniqueOrThrow({
    where: { id: validated.workoutBlockExerciseId },
    include: {
      workoutBlock: {
        include: {
          workoutDay: { select: { athleteId: true } },
        },
      },
    },
  });

  if (exercise.workoutBlock.workoutDay.athleteId !== user.id) {
    throw new AuthorizationError("Cannot modify exercises for other athletes");
  }

  const updatedExercise = await prisma.workoutBlockExercise.update({
    where: { id: validated.workoutBlockExerciseId },
    data: { comment: validated.comment },
  });

  return updatedExercise;
}
