import { redirect } from "next/navigation";
import { getSuggestedWorkoutDay } from "@/lib/workouts/getSuggestedWorkoutDay";
import getUser from "@/lib/auth/getUser";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getUser();

  // This shouldn't happen due to middleware, but handle defensively
  if (!user) {
    redirect("/login");
  }

  const suggested = await getSuggestedWorkoutDay(user.id);

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
