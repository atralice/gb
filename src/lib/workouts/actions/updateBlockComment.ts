"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const UpdateBlockCommentSchema = z.object({
  blockId: z.string().uuid(),
  comment: z.string().nullable(),
});

export async function updateBlockComment(
  input: z.infer<typeof UpdateBlockCommentSchema>
) {
  const validated = UpdateBlockCommentSchema.parse(input);

  const block = await prisma.workoutBlock.update({
    where: { id: validated.blockId },
    data: { comment: validated.comment },
  });

  return block;
}
