import { redirect } from "next/navigation";
import { getSuggestedWorkoutDay } from "@/lib/workouts/getSuggestedWorkoutDay";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // TODO: Replace with actual auth
  const athlete = await prisma.user.findFirst({
    where: { role: "athlete" },
  });

  if (!athlete) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No athlete found</h1>
          <p className="text-slate-600">
            Please run the seed script to populate the database.
          </p>
        </div>
      </main>
    );
  }

  const suggested = await getSuggestedWorkoutDay(athlete.id);

  if (!suggested) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No workouts found</h1>
          <p className="text-slate-600">
            Please run the seed script to populate the database.
          </p>
        </div>
      </main>
    );
  }

  redirect(`/${suggested.weekNumber}/${suggested.dayIndex}`);
}
