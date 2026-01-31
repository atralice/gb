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
        orderBy: [{ block: "asc" }, { order: "asc" }],
      },
      blockComments: true,
    },
  });

  return workoutDay;
}

export type WorkoutDayWithExercises = Prisma.PromiseReturnType<
  typeof getWorkoutDay
>;
