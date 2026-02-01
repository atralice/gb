import { notFound } from "next/navigation";
import { getWorkoutDay } from "@/lib/workouts/getWorkoutDay";
import { getAvailableWorkoutDays } from "@/lib/workouts/getAvailableWorkoutDays";
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

  // Validate params
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

  const [workoutDay, _availableDays] = await Promise.all([
    getWorkoutDay(athlete.id, weekNumber, dayIndex),
    getAvailableWorkoutDays(),
  ]);

  if (!workoutDay) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header placeholder */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pb-4 pt-12">
        <h1 className="text-2xl font-bold text-slate-900">
          Día {workoutDay.dayIndex}
        </h1>
        <p className="text-sm text-slate-400">Semana {workoutDay.weekNumber}</p>
      </header>

      {/* Content placeholder */}
      <div className="p-4">
        <p className="text-slate-600">
          Workout page for week {weekNumber}, day {dayIndex}, block {blockIndex}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {workoutDay.blocks.length} blocks,{" "}
          {workoutDay.blocks.reduce((acc, b) => acc + b.exercises.length, 0)}{" "}
          exercises
        </p>
      </div>
    </main>
  );
}
