import { redirect, notFound } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import WeekDetailTable from "@/components/trainer/WeekDetailTable";
import PageShell from "@/components/ui/PageShell";
import WeekNav from "@/components/ui/WeekNav";
import { format } from "date-fns";

type Props = {
  params: Promise<{ athleteId: string; weekNumber: string }>;
};

export default async function WeekEditPage({ params }: Props) {
  const [user, { athleteId, weekNumber: weekStr }] = await Promise.all([
    getUser(),
    params,
  ]);
  if (!user) redirect("/login");

  const weekNumber = parseInt(weekStr, 10);
  if (isNaN(weekNumber)) notFound();

  const weekData = await getAthleteWeek(athleteId, weekNumber);
  if (!weekData) notFound();

  return (
    <PageShell
      backHref={`/trainer/athletes/${athleteId}`}
      stickyTop="top-12"
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
          buildHref={(w) => `/trainer/athletes/${athleteId}/week/${w}`}
        />
      }
    >
      <div className="p-4">
        <WeekDetailTable data={weekData} trainerId={user.id} />
      </div>
    </PageShell>
  );
}
