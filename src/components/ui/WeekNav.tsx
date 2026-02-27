import Link from "next/link";

type WeekNavProps = {
  weekNumber: number;
  previousExists: boolean;
  nextExists: boolean;
  buildHref: (week: number) => string;
};

export default function WeekNav({
  weekNumber,
  previousExists,
  nextExists,
  buildHref,
}: WeekNavProps) {
  return (
    <div className="flex items-center gap-2">
      {previousExists ? (
        <Link
          href={buildHref(weekNumber - 1)}
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          ← Sem {weekNumber - 1}
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-sm text-slate-300">
          ← Sem {weekNumber - 1}
        </span>
      )}

      {nextExists ? (
        <Link
          href={buildHref(weekNumber + 1)}
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
  );
}
