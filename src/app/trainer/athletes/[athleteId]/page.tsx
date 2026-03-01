import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getAthleteOverview } from "@/lib/trainer/getAthleteOverview";
import WeekOverviewTable from "@/components/trainer/WeekOverviewTable";
import CreateWeekDialogTrigger from "@/components/trainer/CreateWeekDialogTrigger";
import PageShell from "@/components/ui/PageShell";

type AthletePageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function AthleteOverviewPage({
  params,
  searchParams,
}: AthletePageProps) {
  const [user, { athleteId }, sp] = await Promise.all([
    getUser(),
    params,
    searchParams,
  ]);
  if (!user) redirect("/login");

  const startWeek = sp.from ? parseInt(sp.from, 10) : undefined;
  const endWeek = sp.to ? parseInt(sp.to, 10) : undefined;

  const overview = await getAthleteOverview(athleteId, {
    startWeek: startWeek && !isNaN(startWeek) ? startWeek : undefined,
    endWeek: endWeek && !isNaN(endWeek) ? endWeek : undefined,
  });

  if (!overview) {
    return (
      <PageShell
        backHref="/trainer/athletes"
        title="Sin entrenamientos"
        stickyTop="top-12"
      >
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
      stickyTop="top-12"
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
