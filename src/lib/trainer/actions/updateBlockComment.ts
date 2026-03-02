"use server";

import prisma from "@/lib/prisma";

export async function updateBlockComment(
  blockId: string,
  comment: string
): Promise<void> {
  await prisma.workoutBlock.update({
    where: { id: blockId },
    data: { comment },
  });
}
