import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getTrainerAthletes } from "@/lib/trainer/getTrainerAthletes";
import AthletesTable from "@/components/trainer/AthletesTable";

export default async function TrainerAthletesPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "trainer") {
    redirect("/");
  }

  const athletes = await getTrainerAthletes(user.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">Mis atletas</h1>
      </header>

      <div className="p-4">
        <AthletesTable athletes={athletes} />
      </div>
    </main>
  );
}
