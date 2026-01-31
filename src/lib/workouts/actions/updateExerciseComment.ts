"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const UpdateExerciseCommentSchema = z.object({
  exerciseId: z.string().uuid(),
  comment: z.string().nullable(),
});

export async function updateExerciseComment(
  input: z.infer<typeof UpdateExerciseCommentSchema>
) {
  const validated = UpdateExerciseCommentSchema.parse(input);

  const exercise = await prisma.workoutDayExercise.update({
    where: { id: validated.exerciseId },
    data: { comment: validated.comment },
  });

  return exercise;
}
