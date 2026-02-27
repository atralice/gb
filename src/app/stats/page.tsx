import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getAthleteStats } from "@/lib/stats/getAthleteStats";
import WeeklyCompletionCard from "@/components/stats/WeeklyCompletionCard";
import AdherenceCard from "@/components/stats/AdherenceCard";
import PersonalRecordsCard from "@/components/stats/PersonalRecordsCard";
import PageShell from "@/components/ui/PageShell";

type StatsPageProps = {
  searchParams: Promise<{ range?: string }>;
};

export default async function StatsPage({ searchParams }: StatsPageProps) {
  const [user, { range }] = await Promise.all([getUser(), searchParams]);

  if (!user) {
    redirect("/login");
  }
  const adherenceRange = range === "month" ? "month" : "week";

  const stats = await getAthleteStats(user.id, adherenceRange);

  return (
    <PageShell backHref="/" title="Estadísticas">
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
    </PageShell>
  );
}
