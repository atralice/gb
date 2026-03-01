"use server";

import prisma from "@/lib/prisma";

export async function copyGlobalExercise(
  globalExerciseId: string,
  trainerId: string
): Promise<{ id: string }> {
  const global = await prisma.exercise.findUniqueOrThrow({
    where: { id: globalExerciseId },
  });

  // If trainer already has an exercise with this name, return it
  const existing = await prisma.exercise.findFirst({
    where: { name: global.name, ownerId: trainerId },
    select: { id: true },
  });

  if (existing) return existing;

  // Create copy in trainer's library
  const copy = await prisma.exercise.create({
    data: {
      name: global.name,
      exerciseType: global.exerciseType,
      instructions: global.instructions,
      videoUrl: global.videoUrl,
      tags: global.tags,
      owner: { connect: { id: trainerId } },
      globalSource: { connect: { id: globalExerciseId } },
    },
    select: { id: true },
  });

  return copy;
}
