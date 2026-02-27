import { redirect, notFound } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import { getLatestWeekNumber } from "@/lib/trainer/getLatestWeekNumber";
import AthleteWeekClient from "@/components/athlete/AthleteWeekClient";
import PageShell from "@/components/ui/PageShell";
import WeekNav from "@/components/ui/WeekNav";

type WeekPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function WeekPage({ searchParams }: WeekPageProps) {
  const [user, { week }] = await Promise.all([getUser(), searchParams]);

  if (!user) {
    redirect("/login");
  }

  let weekNumber: number;
  if (week) {
    weekNumber = parseInt(week, 10);
    if (isNaN(weekNumber)) {
      notFound();
    }
  } else {
    const latest = await getLatestWeekNumber(user.id);
    if (!latest) {
      return (
        <PageShell backHref="/" title="Mi semana">
          <div className="p-4 text-center text-slate-500">
            No tenés entrenamientos programados.
          </div>
        </PageShell>
      );
    }
    weekNumber = latest;
  }

  const weekData = await getAthleteWeek(user.id, weekNumber);

  if (!weekData) {
    notFound();
  }

  return (
    <PageShell
      backHref="/"
      title={`Semana ${weekNumber}`}
      actions={
        <WeekNav
          weekNumber={weekNumber}
          previousExists={weekData.previousWeekExists}
          nextExists={weekData.nextWeekExists}
          buildHref={(w) => `/week?week=${w}`}
        />
      }
    >
      <div className="p-4">
        <AthleteWeekClient weekData={weekData} weekNumber={weekNumber} />
      </div>
    </PageShell>
  );
}
