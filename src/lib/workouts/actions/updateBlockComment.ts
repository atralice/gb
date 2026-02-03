"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import getUser from "@/lib/auth/getUser";
import { AuthorizationError } from "@/types/errors";

const UpdateBlockCommentSchema = z.object({
  blockId: z.string().uuid(),
  comment: z.string().nullable(),
});

export async function updateBlockComment(
  input: z.infer<typeof UpdateBlockCommentSchema>
) {
  const validated = UpdateBlockCommentSchema.parse(input);

  // Get current user and verify authorization
  const user = await getUser();
  if (!user) {
    throw new AuthorizationError("Must be authenticated");
  }

  // Verify ownership before updating
  const block = await prisma.workoutBlock.findUniqueOrThrow({
    where: { id: validated.blockId },
    include: {
      workoutDay: { select: { athleteId: true } },
    },
  });

  if (block.workoutDay.athleteId !== user.id) {
    throw new AuthorizationError("Cannot modify blocks for other athletes");
  }

  const updatedBlock = await prisma.workoutBlock.update({
    where: { id: validated.blockId },
    data: { comment: validated.comment },
  });

  return updatedBlock;
}
