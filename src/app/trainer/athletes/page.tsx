import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getTrainerAthletes } from "@/lib/trainer/getTrainerAthletes";
import AthletesTable from "@/components/trainer/AthletesTable";
import PageShell from "@/components/ui/PageShell";

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
    <PageShell title="Mis atletas">
      <div className="p-4">
        <AthletesTable athletes={athletes} />
      </div>
    </PageShell>
  );
}
