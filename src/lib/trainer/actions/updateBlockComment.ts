"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateBlockComment(
  blockId: string,
  comment: string
): Promise<void> {
  await prisma.workoutBlock.update({
    where: { id: blockId },
    data: { comment },
  });

  revalidatePath("/trainer/athletes");
}
