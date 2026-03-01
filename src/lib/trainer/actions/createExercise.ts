"use server";

import prisma from "@/lib/prisma";

export async function createExercise(name: string): Promise<{ id: string }> {
  const exercise = await prisma.exercise.create({
    data: { name },
    select: { id: true },
  });

  return exercise;
}
