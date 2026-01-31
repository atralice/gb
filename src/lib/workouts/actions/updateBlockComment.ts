"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const UpdateBlockCommentSchema = z.object({
  workoutDayId: z.string().uuid(),
  block: z.string(),
  comment: z.string(),
});

export async function updateBlockComment(
  input: z.infer<typeof UpdateBlockCommentSchema>
) {
  const validated = UpdateBlockCommentSchema.parse(input);

  // Upsert block comment
  const blockComment = await prisma.workoutDayBlockComment.upsert({
    where: {
      workoutDayId_block: {
        workoutDayId: validated.workoutDayId,
        block: validated.block,
      },
    },
    update: { comment: validated.comment },
    create: {
      workoutDayId: validated.workoutDayId,
      block: validated.block,
      comment: validated.comment,
    },
  });

  return blockComment;
}
