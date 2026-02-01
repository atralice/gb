import prisma from "../prisma";
import type { Prisma } from "@prisma/client";

export async function getWorkoutDay(
  athleteId: string,
  weekNumber: number,
  dayIndex: number
) {
  const workoutDay = await prisma.workoutDay.findFirst({
    where: {
      athleteId,
      weekNumber,
      dayIndex,
    },
    include: {
      blocks: {
        include: {
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  instructions: true,
                  videoUrl: true,
                  tags: true,
                },
              },
              sets: {
                orderBy: {
                  setIndex: "asc",
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  return workoutDay;
}

export type WorkoutDayWithBlocks = Prisma.PromiseReturnType<
  typeof getWorkoutDay
>;
