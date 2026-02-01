"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const UpdateExerciseCommentSchema = z.object({
  workoutBlockExerciseId: z.string().uuid(),
  comment: z.string().nullable(),
});

export async function updateExerciseComment(
  input: z.infer<typeof UpdateExerciseCommentSchema>
) {
  const validated = UpdateExerciseCommentSchema.parse(input);

  const exercise = await prisma.workoutBlockExercise.update({
    where: { id: validated.workoutBlockExerciseId },
    data: { comment: validated.comment },
  });

  return exercise;
}
