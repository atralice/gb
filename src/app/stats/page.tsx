import { redirect } from "next/navigation";
import Link from "next/link";
import getUser from "@/lib/auth/getUser";
import { getAthleteStats } from "@/lib/stats/getAthleteStats";
import WeeklyCompletionCard from "@/components/stats/WeeklyCompletionCard";
import AdherenceCard from "@/components/stats/AdherenceCard";
import PersonalRecordsCard from "@/components/stats/PersonalRecordsCard";

type StatsPageProps = {
  searchParams: Promise<{ range?: string }>;
};

export default async function StatsPage({ searchParams }: StatsPageProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { range } = await searchParams;
  const adherenceRange = range === "month" ? "month" : "week";

  const stats = await getAthleteStats(user.id, adherenceRange);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Volver"
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
          <h1 className="text-lg font-semibold text-slate-900">Estadísticas</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <WeeklyCompletionCard
          completed={stats.weeklyCompletion.completed}
          skipped={stats.weeklyCompletion.skipped}
          total={stats.weeklyCompletion.total}
          weekStart={stats.weeklyCompletion.weekStart}
          weekEnd={stats.weeklyCompletion.weekEnd}
        />

        <AdherenceCard
          range={stats.adherence.range}
          avgWeightDiff={stats.adherence.avgWeightDiff}
          avgRepsDiff={stats.adherence.avgRepsDiff}
        />

        <PersonalRecordsCard records={stats.personalRecords} />
      </div>
    </main>
  );
}
