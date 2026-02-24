"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateBlockSeriesCount(
  blockId: string,
  newCount: number
): Promise<void> {
  // 1. Fetch the block with its exercises and their sets (ordered by setIndex asc)
  const block = await prisma.workoutBlock.findUniqueOrThrow({
    where: { id: blockId },
    include: {
      exercises: {
        include: {
          sets: {
            orderBy: { setIndex: "asc" },
          },
        },
      },
    },
  });

  // 2. Build all create/delete operations for each exercise
  const operations: ReturnType<
    typeof prisma.set.create | typeof prisma.set.deleteMany
  >[] = [];

  for (const exercise of block.exercises) {
    const currentCount = exercise.sets.length;

    if (newCount > currentCount) {
      // Create new sets with setIndex = currentCount+1, currentCount+2, ...
      for (let i = currentCount + 1; i <= newCount; i++) {
        operations.push(
          prisma.set.create({
            data: {
              workoutBlockExerciseId: exercise.id,
              setIndex: i,
              reps: null,
              weightKg: null,
              repsPerSide: false,
            },
          })
        );
      }
    } else if (newCount < currentCount) {
      // Delete sets with the highest setIndex values
      const setsToDelete = exercise.sets.slice(newCount);
      operations.push(
        prisma.set.deleteMany({
          where: {
            id: { in: setsToDelete.map((s) => s.id) },
          },
        })
      );
    }
    // If equal: do nothing
  }

  // 3. All operations in a single $transaction
  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  // 4. Revalidate
  revalidatePath("/trainer/athletes");
}
