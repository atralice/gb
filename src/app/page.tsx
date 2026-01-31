import WorkoutCarousel from "@/components/workout/WorkoutCarousel";
import { getWorkoutDay } from "@/lib/workouts/getWorkoutDay";

export default async function HomePage() {
  const workoutDay = await getWorkoutDay(1, 10);
  if (!workoutDay) {
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

  return (
    <main className="min-h-screen bg-slate-50 p-2 md:p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-900">
            {workoutDay.label}
          </h1>
          <p className="text-xs text-slate-600">
            Semana {workoutDay.weekNumber}
          </p>
        </div>

        <WorkoutCarousel workoutDay={workoutDay} />
      </div>
    </main>
  );
}
