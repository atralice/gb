"use server";

import prisma from "@/lib/prisma";

export async function searchExercises(
  query: string
): Promise<{ id: string; name: string }[]> {
  return prisma.exercise.findMany({
    where: query
      ? {
          name: {
            contains: query,
            mode: "insensitive",
          },
        }
      : undefined,
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
    take: 20,
  });
}
