"use server";

import prisma from "@/lib/prisma";

export type ExerciseSearchResult = {
  id: string;
  name: string;
  exerciseType: string;
  isGlobal: boolean;
};

export async function searchExercises(
  query: string,
  trainerId?: string
): Promise<ExerciseSearchResult[]> {
  const nameFilter = query
    ? { name: { contains: query, mode: "insensitive" as const } }
    : {};

  // If trainerId given: own exercises + global. Otherwise: global only.
  const ownerFilter = trainerId
    ? { OR: [{ ownerId: trainerId }, { ownerId: null }] }
    : { ownerId: null };

  const exercises = await prisma.exercise.findMany({
    where: { ...nameFilter, ...ownerFilter },
    select: {
      id: true,
      name: true,
      exerciseType: true,
      ownerId: true,
    },
    orderBy: { name: "asc" },
    take: 40,
  });

  // Sort: trainer's own first, then global
  if (trainerId) {
    exercises.sort((a, b) => {
      const aOwn = a.ownerId === trainerId ? 0 : 1;
      const bOwn = b.ownerId === trainerId ? 0 : 1;
      if (aOwn !== bOwn) return aOwn - bOwn;
      return a.name.localeCompare(b.name);
    });
  }

  return exercises.slice(0, 20).map((e) => ({
    id: e.id,
    name: e.name,
    exerciseType: e.exerciseType,
    isGlobal: e.ownerId === null,
  }));
}
