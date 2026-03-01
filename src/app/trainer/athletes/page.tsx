import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getTrainerAthletes } from "@/lib/trainer/getTrainerAthletes";
import AthletesTable from "@/components/trainer/AthletesTable";

export default async function TrainerAthletesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const athletes = await getTrainerAthletes(user.id);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <AthletesTable athletes={athletes} />
    </div>
  );
}
