import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getAthleteOverview } from "@/lib/trainer/getAthleteOverview";
import WeekOverviewTable from "@/components/trainer/WeekOverviewTable";
import CreateWeekDialogTrigger from "@/components/trainer/CreateWeekDialogTrigger";
import PageShell from "@/components/ui/PageShell";

type AthletePageProps = {
  params: Promise<{ athleteId: string }>;
};

export default async function AthleteOverviewPage({
  params,
}: AthletePageProps) {
  const [user, { athleteId }] = await Promise.all([getUser(), params]);
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/");

  const overview = await getAthleteOverview(athleteId);

  if (!overview) {
    return (
      <PageShell backHref="/trainer/athletes" title="Sin entrenamientos">
        <div className="p-4 text-center text-slate-500">
          Este atleta no tiene entrenamientos programados.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      backHref="/trainer/athletes"
      title={overview.athlete.name}
      actions={
        <CreateWeekDialogTrigger
          athleteId={athleteId}
          trainerId={user.id}
          sourceWeek={overview.latestWeekNumber}
          targetWeek={overview.latestWeekNumber + 1}
        />
      }
    >
      <div className="p-4">
        <WeekOverviewTable data={overview} athleteId={athleteId} />
      </div>
    </PageShell>
  );
}
