import { notFound } from "next/navigation";
import { getWorkoutDay } from "@/lib/workouts/getWorkoutDay";
import { getAvailableWorkoutDays } from "@/lib/workouts/getAvailableWorkoutDays";
import { getSuggestedWorkoutDay } from "@/lib/workouts/getSuggestedWorkoutDay";
import WorkoutViewer from "@/components/workout/WorkoutViewer";
import prisma from "@/lib/prisma";

type WorkoutPageProps = {
  params: Promise<{ week: string; day: string }>;
  searchParams: Promise<{ block?: string }>;
};

export default async function WorkoutPage({
  params,
  searchParams,
}: WorkoutPageProps) {
  const { week, day } = await params;
  const { block } = await searchParams;

  const weekNumber = parseInt(week, 10);
  const dayIndex = parseInt(day, 10);
  const blockIndex = block ? parseInt(block, 10) : 0;

  if (isNaN(weekNumber) || isNaN(dayIndex)) {
    notFound();
  }

  // TODO: Replace with actual auth
  const athlete = await prisma.user.findFirst({
    where: { role: "athlete" },
  });

  if (!athlete) {
    notFound();
  }

  const [workoutDay, availableDays, suggested] = await Promise.all([
    getWorkoutDay(athlete.id, weekNumber, dayIndex),
    getAvailableWorkoutDays(),
    getSuggestedWorkoutDay(athlete.id),
  ]);

  if (!workoutDay) {
    notFound();
  }

  return (
    <WorkoutViewer
      workoutDay={workoutDay}
      availableDays={availableDays}
      initialBlockIndex={blockIndex}
      suggestedDay={suggested?.dayIndex ?? 1}
    />
  );
}
