import { notFound, redirect } from "next/navigation";
import { getWorkoutDay } from "@/lib/workouts/getWorkoutDay";
import { getAvailableWorkoutDays } from "@/lib/workouts/getAvailableWorkoutDays";
import { getSuggestedWorkoutDay } from "@/lib/workouts/getSuggestedWorkoutDay";
import WorkoutViewer from "@/components/workout/WorkoutViewer";
import getUser from "@/lib/auth/getUser";

type WorkoutPageProps = {
  params: Promise<{ week: string; day: string }>;
  searchParams: Promise<{ block?: string }>;
};

export default async function WorkoutPage({
  params,
  searchParams,
}: WorkoutPageProps) {
  // Start user fetch early
  const userPromise = getUser();

  // Parallel await for params and searchParams
  const [{ week, day }, { block }] = await Promise.all([params, searchParams]);

  const weekNumber = parseInt(week, 10);
  const dayIndex = parseInt(day, 10);
  const blockIndex = block ? parseInt(block, 10) : 0;

  if (isNaN(weekNumber) || isNaN(dayIndex)) {
    notFound();
  }

  const user = await userPromise;

  // This shouldn't happen due to middleware, but handle defensively
  if (!user) {
    redirect("/login");
  }

  // Fetch data in parallel
  const [workoutDay, availableDays, suggested] = await Promise.all([
    getWorkoutDay(user.id, weekNumber, dayIndex),
    getAvailableWorkoutDays(user.id),
    getSuggestedWorkoutDay(user.id),
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
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
