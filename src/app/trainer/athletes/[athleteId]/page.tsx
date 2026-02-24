import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import { getAthleteOverview } from "@/lib/trainer/getAthleteOverview";
import WeekOverviewTable from "@/components/trainer/WeekOverviewTable";
import WeekDetailTable from "@/components/trainer/WeekDetailTable";
import CreateWeekDialogTrigger from "@/components/trainer/CreateWeekDialogTrigger";
import { format } from "date-fns";

type AthleteWeekPageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ week?: string }>;
};

function BackArrow() {
  return (
    <svg
      className="h-6 w-6 text-slate-600"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  );
}

export default async function AthleteWeekPage({
  params,
  searchParams,
}: AthleteWeekPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/");

  const { athleteId } = await params;
  const { week } = await searchParams;

  // Detail view: ?week=N
  if (week) {
    const weekNumber = parseInt(week, 10);
    if (isNaN(weekNumber)) notFound();

    const weekData = await getAthleteWeek(athleteId, weekNumber);
    if (!weekData) notFound();

    return (
      <main className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/trainer/athletes/${athleteId}`}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
              >
                <BackArrow />
              </Link>
              <h1 className="text-lg font-semibold text-slate-900">
                {weekData.athlete.name} — Semana {weekNumber}
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({format(weekData.weekStartDate, "dd/MM")})
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {weekData.previousWeekExists ? (
                <Link
                  href={`/trainer/athletes/${athleteId}?week=${weekNumber - 1}`}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ← Sem {weekNumber - 1}
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-sm text-slate-300">
                  ← Sem {weekNumber - 1}
                </span>
              )}

              {weekData.nextWeekExists ? (
                <Link
                  href={`/trainer/athletes/${athleteId}?week=${weekNumber + 1}`}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Sem {weekNumber + 1} →
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-sm text-slate-300">
                  Sem {weekNumber + 1} →
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="p-4">
          <WeekDetailTable data={weekData} />
        </div>
      </main>
    );
  }

  // Overview view: no ?week= param
  const overview = await getAthleteOverview(athleteId);

  if (!overview) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/trainer/athletes"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
            >
              <BackArrow />
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">
              Sin entrenamientos
            </h1>
          </div>
        </header>
        <div className="p-4 text-center text-slate-500">
          Este atleta no tiene entrenamientos programados.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/trainer/athletes"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
            >
              <BackArrow />
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">
              {overview.athlete.name}
            </h1>
          </div>

          <CreateWeekDialogTrigger
            athleteId={athleteId}
            trainerId={user.id}
            sourceWeek={overview.latestWeekNumber}
            targetWeek={overview.latestWeekNumber + 1}
          />
        </div>
      </header>

      <div className="p-4">
        <WeekOverviewTable data={overview} athleteId={athleteId} />
      </div>
    </main>
  );
}
