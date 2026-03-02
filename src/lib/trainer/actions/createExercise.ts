"use server";

import type { ExerciseType } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function createExercise({
  name,
  exerciseType = "weighted",
  ownerId,
}: {
  name: string;
  exerciseType?: ExerciseType;
  ownerId?: string;
}): Promise<{ id: string }> {
  const exercise = await prisma.exercise.create({
    data: {
      name,
      exerciseType,
      ...(ownerId ? { owner: { connect: { id: ownerId } } } : {}),
    },
    select: { id: true },
  });

  return exercise;
}
