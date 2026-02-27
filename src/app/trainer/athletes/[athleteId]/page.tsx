import { redirect, notFound } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import { getAthleteOverview } from "@/lib/trainer/getAthleteOverview";
import WeekOverviewTable from "@/components/trainer/WeekOverviewTable";
import WeekDetailTable from "@/components/trainer/WeekDetailTable";
import CreateWeekDialogTrigger from "@/components/trainer/CreateWeekDialogTrigger";
import PageShell from "@/components/ui/PageShell";
import WeekNav from "@/components/ui/WeekNav";
import { format } from "date-fns";

type AthleteWeekPageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ week?: string }>;
};

export default async function AthleteWeekPage({
  params,
  searchParams,
}: AthleteWeekPageProps) {
  const [user, { athleteId }, { week }] = await Promise.all([
    getUser(),
    params,
    searchParams,
  ]);
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/");

  // Detail view: ?week=N
  if (week) {
    const weekNumber = parseInt(week, 10);
    if (isNaN(weekNumber)) notFound();

    const weekData = await getAthleteWeek(athleteId, weekNumber);
    if (!weekData) notFound();

    return (
      <PageShell
        backHref={`/trainer/athletes/${athleteId}`}
        title={
          <>
            {weekData.athlete.name} — Semana {weekNumber}
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({format(weekData.weekStartDate, "dd/MM")})
            </span>
          </>
        }
        actions={
          <WeekNav
            weekNumber={weekNumber}
            previousExists={weekData.previousWeekExists}
            nextExists={weekData.nextWeekExists}
            buildHref={(w) => `/trainer/athletes/${athleteId}?week=${w}`}
          />
        }
      >
        <div className="p-4">
          <WeekDetailTable data={weekData} />
        </div>
      </PageShell>
    );
  }

  // Overview view: no ?week= param
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
