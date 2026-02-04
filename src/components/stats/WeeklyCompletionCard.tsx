type WeeklyCompletionCardProps = {
  completed: number;
  skipped: number;
  total: number;
};

export default function WeeklyCompletionCard({
  completed,
  skipped,
  total,
}: WeeklyCompletionCardProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-500">Esta semana</h2>
        <span className="text-2xl font-bold text-slate-900">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm text-slate-600">
        {completed}/{total} completados
        {skipped > 0 && (
          <span className="text-slate-400"> ({skipped} salteados)</span>
        )}
      </p>
    </div>
  );
}
