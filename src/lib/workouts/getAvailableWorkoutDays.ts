import prisma from "../prisma";

export async function getAvailableWorkoutDays() {
  const workoutDays = await prisma.workoutDay.findMany({
    select: {
      id: true,
      dayIndex: true,
      weekNumber: true,
      label: true,
    },
    orderBy: [{ weekNumber: "desc" }, { dayIndex: "asc" }],
  });

  return workoutDays;
}

export type AvailableWorkoutDay = Awaited<
  ReturnType<typeof getAvailableWorkoutDays>
>[number];
