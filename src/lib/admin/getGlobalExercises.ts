import "server-only";
import { cache } from "react";
import type { ExerciseType } from "@prisma/client";
import prisma from "@/lib/prisma";

export type GlobalExercise = {
  id: string;
  name: string;
  exerciseType: ExerciseType;
  instructions: string | null;
  videoUrl: string | null;
  tags: string[];
};

type Filters = {
  search?: string;
  type?: ExerciseType;
};

export const getGlobalExercises = cache(async function getGlobalExercises(
  filters?: Filters
): Promise<GlobalExercise[]> {
  const where: Record<string, unknown> = { ownerId: null };

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
    },
    orderBy: { name: "asc" },
  });
});
