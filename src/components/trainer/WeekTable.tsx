"use client";

import type { AthleteWeekData } from "@/lib/trainer/getAthleteWeek";

type WeekTableProps = {
  data: AthleteWeekData;
  mode: "edit" | "readonly";
  onDayClick?: (dayIndex: number) => void;
};

export default function WeekTable({ data, mode, onDayClick }: WeekTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              Ejercicio
            </th>
            <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-16">
              Serie
            </th>
            <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-20">
              Reps
            </th>
            <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
              Peso (kg)
            </th>
            {mode === "edit" && (
              <>
                <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                  Actual
                </th>
                <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                  Últ. sem
                </th>
              </>
            )}
            {mode === "readonly" && (
              <th className="text-center px-3 py-3 text-sm font-medium text-slate-600 w-24">
                Hecho
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.days.map((day) => (
            <WeekTableDay
              key={`day-${day.dayIndex}`}
              day={day}
              mode={mode}
              onDayClick={onDayClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeekTableDay({
  day,
  mode,
  onDayClick,
}: {
  day: AthleteWeekData["days"][number];
  mode: "edit" | "readonly";
  onDayClick?: (dayIndex: number) => void;
}) {
  return (
    <>
      <tr
        className={`bg-slate-100 border-y border-slate-200 ${
          mode === "readonly" && onDayClick
            ? "cursor-pointer hover:bg-slate-200"
            : ""
        }`}
        onClick={() => mode === "readonly" && onDayClick?.(day.dayIndex)}
      >
        <td
          colSpan={mode === "edit" ? 6 : 5}
          className="px-4 py-2 text-sm font-semibold text-slate-700"
        >
          <div className="flex items-center justify-between">
            <span>DÍA {day.dayIndex}</span>
            {mode === "readonly" && (
              <span className="text-slate-500 text-xs">
                {day.exercises.reduce(
                  (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
                  0
                )}
                /{day.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} →
              </span>
            )}
          </div>
        </td>
      </tr>

      {day.exercises.map((exercise) =>
        exercise.sets.map((set, setIndex) => (
          <tr key={set.id} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-2 text-sm text-slate-700">
              {setIndex === 0 ? exercise.exerciseName : ""}
            </td>
            <td className="px-3 py-2 text-center text-sm text-slate-600">
              {set.setIndex}
            </td>
            <td className="px-3 py-2 text-center text-sm text-slate-600">
              {set.reps ?? "—"}
            </td>
            <td className="px-3 py-2 text-center text-sm text-slate-600">
              {set.weightKg ?? "—"}
            </td>
            {mode === "edit" && (
              <>
                <td className="px-3 py-2 text-center text-sm text-slate-500">
                  {set.actualWeightKg !== null && set.actualReps !== null
                    ? `${set.actualWeightKg}/${set.actualReps}`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-center text-sm text-slate-400">
                  {set.lastWeekActual
                    ? `${set.lastWeekActual.weightKg}/${set.lastWeekActual.reps}`
                    : "—"}
                </td>
              </>
            )}
            {mode === "readonly" && (
              <td className="px-3 py-2 text-center text-sm">
                {set.completed ? (
                  <span className="text-emerald-600">
                    ✓{" "}
                    {set.actualWeightKg !== null
                      ? `${set.actualWeightKg}/${set.actualReps}`
                      : ""}
                  </span>
                ) : set.skipped ? (
                  <span className="text-slate-400">Salteado</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
            )}
          </tr>
        ))
      )}
    </>
  );
}
