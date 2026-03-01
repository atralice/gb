"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import type {
  AthleteOverviewData,
  OverviewDay,
} from "@/lib/trainer/getAthleteOverview";
import CompactSets from "@/components/trainer/CompactSets";
import { format } from "date-fns";

const DAY_LABEL_RE = /^d[ií]a\s+\d+$/i;

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
  const pathname = usePathname();
  const { earliestWeekNumber, latestWeekNumber, windowStart, windowEnd } = data;

  const canGoLeft = windowStart > earliestWeekNumber;
  const canGoRight = windowEnd < latestWeekNumber;

  const leftFrom = Math.max(earliestWeekNumber, windowStart - 4);
  const leftTo = windowStart - 1;
  const rightFrom = windowEnd + 1;
  const rightTo = Math.min(latestWeekNumber, windowEnd + 4);

  const leftHref = `${pathname}?from=${leftFrom}&to=${leftTo}`;
  const rightHref = `${pathname}?from=${rightFrom}&to=${rightTo}`;

  return (
    <div className="space-y-8">
      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div>
          {canGoLeft ? (
            <Link
              href={leftHref}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              &#8592; Sem {leftFrom}–{leftTo}
            </Link>
          ) : (
            <span />
          )}
        </div>
        <span className="text-xs text-slate-400">
          Semanas {windowStart}–{windowEnd}
        </span>
        <div>
          {canGoRight ? (
            <Link
              href={rightHref}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Sem {rightFrom}–{rightTo} &#8594;
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>

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

  // Build exercise rows as union across ALL weeks
  const exerciseRowMap = new Map<string, ExerciseRow>();
  for (const week of day.weeks) {
    for (const ex of week.exercises) {
      const key = `${ex.blockLabel}-${ex.exerciseOrder}`;
      if (!exerciseRowMap.has(key)) {
        exerciseRowMap.set(key, {
          blockLabel: ex.blockLabel,
          exerciseOrder: ex.exerciseOrder,
          exerciseName: ex.exerciseName,
          blockComment: ex.blockComment,
          exerciseComment: ex.exerciseComment,
        });
      }
    }
  }
  const exerciseRows = [...exerciseRowMap.values()].sort((a, b) =>
    a.blockLabel === b.blockLabel
      ? a.exerciseOrder - b.exerciseOrder
      : a.blockLabel.localeCompare(b.blockLabel)
  );

  if (exerciseRows.length === 0) return null;

  const handleWeekClick = (weekNumber: number) => {
    router.push(`/trainer/athletes/${athleteId}/week/${weekNumber}`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Day header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-900">
          Día {day.dayIndex}
          {day.label && !DAY_LABEL_RE.test(day.label) && (
            <span className="ml-2 font-normal text-slate-500">
              — {day.label}
            </span>
          )}
        </h3>
        {day.notes && (
          <p className="mt-0.5 text-xs text-slate-400">{day.notes}</p>
        )}
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-10 bg-white text-left px-3 py-2 text-xs font-medium text-slate-400 w-16 min-w-[64px]">
                Bloque
              </th>
              <th className="sticky left-16 z-10 bg-white text-left px-3 py-2 text-xs font-medium text-slate-400 min-w-[140px]">
                Ejercicio
              </th>
              {day.weeks.map((week) => (
                <th
                  key={`week-${week.weekNumber}`}
                  className="text-center px-3 py-2 text-xs font-medium text-slate-900 min-w-[100px] cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => handleWeekClick(week.weekNumber)}
                >
                  Sem {week.weekNumber}{" "}
                  <span className="text-slate-400 font-normal">
                    ({format(week.weekStartDate, "dd/MM")})
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {
              exerciseRows.reduce<{
                elements: React.ReactNode[];
                blockIndex: number;
                lastBlock: string | null;
              }>(
                (acc, row) => {
                  const isBlockBoundary =
                    acc.lastBlock !== null && acc.lastBlock !== row.blockLabel;
                  const blockIndex = isBlockBoundary
                    ? acc.blockIndex + 1
                    : acc.blockIndex;
                  const rowBg =
                    blockIndex % 2 === 0 ? "bg-white" : "bg-slate-50";

                  const comment = row.exerciseComment ?? row.blockComment;
                  const combinedLabel = `${row.blockLabel}${row.exerciseOrder}`;

                  acc.elements.push(
                    <tr
                      key={`${row.blockLabel}-${row.exerciseOrder}`}
                      className={`${rowBg} ${
                        isBlockBoundary ? "border-t border-slate-200" : ""
                      }`}
                    >
                      <td
                        className={`sticky left-0 z-10 ${rowBg} px-3 py-2 text-xs font-medium text-slate-900 w-16`}
                      >
                        {combinedLabel}
                      </td>
                      <td
                        className={`sticky left-16 z-10 ${rowBg} px-3 py-2 text-sm text-slate-700 min-w-[140px]`}
                      >
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
                  acc.blockIndex = blockIndex;
                  acc.lastBlock = row.blockLabel;
                  return acc;
                },
                { elements: [], blockIndex: 0, lastBlock: null }
              ).elements
            }
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
