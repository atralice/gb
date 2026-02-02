import { cache } from "react";
import prisma from "../prisma";

export const getAvailableWorkoutDays = cache(async () => {
  const workoutDays = await prisma.workoutDay.findMany({
    select: {
      id: true,
      dayIndex: true,
      weekNumber: true,
      weekStartDate: true,
      label: true,
      blocks: {
        select: {
          exercises: {
            select: {
              sets: {
                select: {
                  id: true,
                  completed: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ weekStartDate: "desc" }, { dayIndex: "asc" }],
  });

  // Compute completion status for each day
  return workoutDays.map((day) => {
    const allSets = day.blocks.flatMap((b) =>
      b.exercises.flatMap((e) => e.sets)
    );
    const totalSets = allSets.length;
    const completedSets = allSets.filter((s) => s.completed).length;
    const isCompleted = totalSets > 0 && completedSets === totalSets;

    return {
      id: day.id,
      dayIndex: day.dayIndex,
      weekNumber: day.weekNumber,
      weekStartDate: day.weekStartDate,
      label: day.label,
      isCompleted,
      totalSets,
      completedSets,
    };
  });
});

export type AvailableWorkoutDay = Awaited<
  ReturnType<typeof getAvailableWorkoutDays>
>[number];
