import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import getUser from "@/lib/auth/getUser";
import { getAthleteWeek } from "@/lib/trainer/getAthleteWeek";
import { getLatestWeekNumber } from "@/lib/trainer/getLatestWeekNumber";
import WeekTable from "@/components/trainer/WeekTable";
import CreateWeekDialogTrigger from "@/components/trainer/CreateWeekDialogTrigger";

type AthleteWeekPageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ week?: string; create?: string }>;
};

export default async function AthleteWeekPage({
  params,
  searchParams,
}: AthleteWeekPageProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "trainer") {
    redirect("/");
  }

  const { athleteId } = await params;
  const { week, create } = await searchParams;

  // Get week number from URL or default to latest
  let weekNumber: number;
  const latest = await getLatestWeekNumber(athleteId);

  if (week) {
    weekNumber = parseInt(week, 10);
    if (isNaN(weekNumber)) {
      notFound();
    }
  } else {
    if (!latest) {
      return (
        <main className="min-h-screen bg-slate-50">
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/trainer/athletes"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
              >
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
    weekNumber = latest;
  }

  const weekData = await getAthleteWeek(athleteId, weekNumber);

  // If week doesn't exist and create=true, show dialog
  const showCreateDialog = !weekData && create === "true" && latest !== null;

  if (!weekData && !showCreateDialog) {
    notFound();
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
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">
              {weekData?.athlete.name ?? "Atleta"} - Semana {weekNumber}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {weekData?.previousWeekExists ? (
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

            {weekData?.nextWeekExists ? (
              <Link
                href={`/trainer/athletes/${athleteId}?week=${weekNumber + 1}`}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Sem {weekNumber + 1} →
              </Link>
            ) : (
              <Link
                href={`/trainer/athletes/${athleteId}?week=${weekNumber + 1}&create=true`}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Sem {weekNumber + 1} →
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="p-4">
        {weekData && <WeekTable data={weekData} mode="edit" />}
      </div>

      {showCreateDialog && latest !== null && (
        <CreateWeekDialogTrigger
          athleteId={athleteId}
          trainerId={user.id}
          sourceWeek={latest}
          targetWeek={weekNumber}
        />
      )}
    </main>
  );
}
