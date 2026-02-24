"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  AthleteOverviewData,
  OverviewDay,
} from "@/lib/trainer/getAthleteOverview";
import CompactSets from "@/components/trainer/CompactSets";
import { format } from "date-fns";

type Props = {
  data: AthleteOverviewData;
  athleteId: string;
};

type ExerciseRow = {
  blockLabel: string;
  exerciseOrder: number;
  exerciseName: string;
  blockComment: string | null;
  exerciseComment: string | null;
};

export default function WeekOverviewTable({ data, athleteId }: Props) {
  return (
    <div className="space-y-8">
      {data.days.map((day) => (
        <DayOverview
          key={`day-${day.dayIndex}`}
          day={day}
          athleteId={athleteId}
        />
      ))}
    </div>
  );
}

function DayOverview({
  day,
  athleteId,
}: {
  day: OverviewDay;
  athleteId: string;
}) {
  const router = useRouter();

  // Build exercise rows from the first week's structure
  const firstWeek = day.weeks[0];
  if (!firstWeek) return null;

  const exerciseRows: ExerciseRow[] = firstWeek.exercises.map((ex) => ({
    blockLabel: ex.blockLabel,
    exerciseOrder: ex.exerciseOrder,
    exerciseName: ex.exerciseName,
    blockComment: ex.blockComment,
    exerciseComment: ex.exerciseComment,
  }));

  const handleWeekClick = (weekNumber: number) => {
    router.push(`/trainer/athletes/${athleteId}?week=${weekNumber}`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Day header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-900">
          D&Iacute;A {day.dayIndex}
          {day.label && (
            <span className="ml-2 font-normal text-slate-500">{day.label}</span>
          )}
        </h3>
        {day.notes && (
          <p className="mt-0.5 text-xs text-slate-400">{day.notes}</p>
        )}
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2 text-xs font-medium text-slate-500 w-16 min-w-[64px]">
                Bloque
              </th>
              <th className="sticky left-16 z-10 bg-slate-50 text-left px-3 py-2 text-xs font-medium text-slate-500 min-w-[140px]">
                Ejercicio
              </th>
              {day.weeks.map((week) => (
                <th
                  key={`week-${week.weekNumber}`}
                  className="text-center px-3 py-2 text-xs font-medium text-slate-500 min-w-[100px] cursor-pointer hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  onClick={() => handleWeekClick(week.weekNumber)}
                >
                  Sem {week.weekNumber}{" "}
                  <span className="text-slate-400">
                    ({format(week.weekStartDate, "dd/MM")})
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exerciseRows.map((row, rowIndex) => {
              const prevRow =
                rowIndex > 0 ? exerciseRows[rowIndex - 1] : undefined;
              const isBlockBoundary =
                prevRow != null && prevRow.blockLabel !== row.blockLabel;

              const comment = row.exerciseComment ?? row.blockComment;
              const combinedLabel = `${row.blockLabel}${row.exerciseOrder}`;

              return (
                <tr
                  key={`${row.blockLabel}-${row.exerciseOrder}`}
                  className={`border-b border-slate-100 last:border-0 ${
                    isBlockBoundary ? "border-t-2 border-t-slate-200" : ""
                  }`}
                >
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 text-xs font-medium text-slate-500 w-16">
                    {combinedLabel}
                  </td>
                  <td className="sticky left-16 z-10 bg-white px-3 py-2 text-sm text-slate-700 min-w-[140px]">
                    <span className="flex items-center gap-1">
                      {row.exerciseName}
                      {comment && <CommentTooltip comment={comment} />}
                    </span>
                  </td>
                  {day.weeks.map((week) => {
                    const matchingEx = week.exercises.find(
                      (ex) =>
                        ex.blockLabel === row.blockLabel &&
                        ex.exerciseOrder === row.exerciseOrder
                    );

                    return (
                      <td
                        key={`week-${week.weekNumber}`}
                        className="px-3 py-2 text-center text-slate-600 whitespace-nowrap"
                      >
                        {matchingEx ? (
                          <CompactSets sets={matchingEx.sets} />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommentTooltip({ comment }: { comment: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="cursor-help text-slate-400 hover:text-slate-600 text-xs">
        &#8505;
      </span>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-slate-800 rounded shadow-lg whitespace-normal max-w-[200px] z-20">
          {comment}
        </span>
      )}
    </span>
  );
}
