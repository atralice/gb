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
  // Parallel await for params and searchParams
  const [{ week, day }, { block }] = await Promise.all([params, searchParams]);

  const weekNumber = parseInt(week, 10);
  const dayIndex = parseInt(day, 10);
  const blockIndex = block ? parseInt(block, 10) : 0;

  if (isNaN(weekNumber) || isNaN(dayIndex)) {
    notFound();
  }

  // TODO: Replace with actual auth
  // Start athlete fetch early, await later
  const athletePromise = prisma.user.findFirst({
    where: { role: "athlete" },
  });

  // Start available days fetch in parallel (doesn't need athlete)
  const availableDaysPromise = getAvailableWorkoutDays();

  const athlete = await athletePromise;
  if (!athlete) {
    notFound();
  }

  // Now fetch athlete-dependent data in parallel
  const [workoutDay, availableDays, suggested] = await Promise.all([
    getWorkoutDay(athlete.id, weekNumber, dayIndex),
    availableDaysPromise,
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
