import prisma from "../prisma";
import type { Prisma } from "@prisma/client";

export async function getWorkoutDay(
  dayIndex: number = 1,
  weekNumber: number = 10
) {
  const workoutDay = await prisma.workoutDay.findFirst({
    where: {
      dayIndex,
      weekNumber,
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
