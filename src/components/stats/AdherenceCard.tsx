"use client";

import { useRouter, useSearchParams } from "next/navigation";

type AdherenceCardProps = {
  range: "week" | "month";
  avgWeightDiff: number | null;
  avgRepsDiff: number | null;
};

export default function AdherenceCard({
  range,
  avgWeightDiff,
  avgRepsDiff,
}: AdherenceCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleRange = () => {
    const newRange = range === "week" ? "month" : "week";
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    router.push(`/stats?${params.toString()}`);
  };

  const formatDiff = (value: number | null, unit: string) => {
    if (value === null) return "—";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}${unit}`;
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-500">Adherencia</h2>
        <button
          onClick={toggleRange}
          className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors"
        >
          {range === "week" ? "Esta semana" : "Último mes"}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Peso</span>
          <span
            className={`text-sm font-semibold ${
              avgWeightDiff === null
                ? "text-slate-400"
                : avgWeightDiff >= 0
                  ? "text-emerald-600"
                  : "text-amber-600"
            }`}
          >
            {formatDiff(avgWeightDiff, "kg promedio")}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Reps</span>
          <span
            className={`text-sm font-semibold ${
              avgRepsDiff === null
                ? "text-slate-400"
                : avgRepsDiff >= 0
                  ? "text-emerald-600"
                  : "text-amber-600"
            }`}
          >
            {formatDiff(avgRepsDiff, " promedio")}
          </span>
        </div>
      </div>
    </div>
  );
}
