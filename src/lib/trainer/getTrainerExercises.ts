import "server-only";
import { cache } from "react";
import type { ExerciseType } from "@prisma/client";
import prisma from "@/lib/prisma";

export type TrainerExercise = {
  id: string;
  name: string;
  exerciseType: ExerciseType;
  instructions: string | null;
  videoUrl: string | null;
  tags: string[];
  globalSourceId: string | null;
};

type Filters = {
  search?: string;
  type?: ExerciseType;
};

export const getTrainerExercises = cache(async function getTrainerExercises(
  trainerId: string,
  filters?: Filters
): Promise<TrainerExercise[]> {
  const where: Record<string, unknown> = { ownerId: trainerId };

  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }
  if (filters?.type) {
    where.exerciseType = filters.type;
  }

  return prisma.exercise.findMany({
    where,
    select: {
      id: true,
      name: true,
      exerciseType: true,
      instructions: true,
      videoUrl: true,
      tags: true,
      globalSourceId: true,
    },
    orderBy: { name: "asc" },
  });
});
