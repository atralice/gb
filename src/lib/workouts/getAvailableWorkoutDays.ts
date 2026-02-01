import prisma from "../prisma";

export async function getAvailableWorkoutDays() {
  const workoutDays = await prisma.workoutDay.findMany({
    select: {
      id: true,
      dayIndex: true,
      weekNumber: true,
      weekStartDate: true,
      label: true,
    },
    orderBy: [{ weekStartDate: "desc" }, { dayIndex: "asc" }],
  });

  return workoutDays;
}

export type AvailableWorkoutDay = Awaited<
  ReturnType<typeof getAvailableWorkoutDays>
>[number];
