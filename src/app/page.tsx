import WorkoutCarousel from "@/components/workout/WorkoutCarousel";
import WorkoutDaySelector from "@/components/workout/WorkoutDaySelector";
import { getWorkoutDay } from "@/lib/workouts/getWorkoutDay";
import { getAvailableWorkoutDays } from "@/lib/workouts/getAvailableWorkoutDays";

type HomePageProps = {
  searchParams: Promise<{ week?: string; day?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const availableDays = await getAvailableWorkoutDays();

  if (availableDays.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No workout found</h1>
          <p className="text-slate-600">
            Please run the seed script to populate the database.
          </p>
        </div>
      </main>
    );
  }

  // Default to first available day if no params
  const defaultDay = availableDays[0];
  const week = params.week
    ? parseInt(params.week, 10)
    : (defaultDay?.weekNumber ?? 1);
  const day = params.day
    ? parseInt(params.day, 10)
    : (defaultDay?.dayIndex ?? 1);

  const workoutDay = await getWorkoutDay(day, week);

  if (!workoutDay) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workout not found</h1>
          <p className="text-slate-600">
            No workout exists for week {week}, day {day}.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-2 md:p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-900">
            {workoutDay.label}
          </h1>
          <p className="text-xs text-slate-600 mb-3">
            Semana {workoutDay.weekNumber}
          </p>
          <WorkoutDaySelector
            availableDays={availableDays}
            currentWeek={week}
            currentDay={day}
          />
        </div>

        <WorkoutCarousel workoutDay={workoutDay} />
      </div>
    </main>
  );
}
