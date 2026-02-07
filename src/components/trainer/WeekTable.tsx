"use client";

import { useState, useTransition } from "react";
import type {
  AthleteWeekData,
  AthleteWeekSet,
} from "@/lib/trainer/getAthleteWeek";
import { updateSets } from "@/lib/trainer/actions/updateSets";

type WeekTableProps = {
  data: AthleteWeekData;
  mode: "edit" | "readonly";
  onDayClick?: (dayIndex: number) => void;
};

type EditedSet = {
  setId: string;
  reps?: number;
  weightKg?: number;
};

export default function WeekTable({ data, mode, onDayClick }: WeekTableProps) {
  const [editedSets, setEditedSets] = useState<Map<string, EditedSet>>(
    new Map()
  );
  const [isPending, startTransition] = useTransition();

  const hasChanges = editedSets.size > 0;

  const handleInputChange = (
    setId: string,
    field: "reps" | "weightKg",
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseFloat(value);

    setEditedSets((prev) => {
      const next = new Map(prev);
      const existing = next.get(setId) ?? { setId };
      next.set(setId, { ...existing, [field]: numValue });
      return next;
    });
  };

  const getCurrentValue = (
    set: AthleteWeekSet,
    field: "reps" | "weightKg"
  ): string => {
    const edited = editedSets.get(set.id);
    if (edited && edited[field] !== undefined) {
      return String(edited[field]);
    }
    const original = set[field];
    return original !== null ? String(original) : "";
  };

  const handleSave = () => {
    const updates = Array.from(editedSets.values()).filter(
      (u) => u.reps !== undefined || u.weightKg !== undefined
    );

    if (updates.length === 0) return;

    startTransition(async () => {
      await updateSets(updates);
      setEditedSets(new Map());
    });
  };

  return (
    <div>
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
                getCurrentValue={getCurrentValue}
                onInputChange={handleInputChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      {mode === "edit" && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasChanges && !isPending
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}

function WeekTableDay({
  day,
  mode,
  onDayClick,
  getCurrentValue,
  onInputChange,
}: {
  day: AthleteWeekData["days"][number];
  mode: "edit" | "readonly";
  onDayClick?: (dayIndex: number) => void;
  getCurrentValue: (set: AthleteWeekSet, field: "reps" | "weightKg") => string;
  onInputChange: (
    setId: string,
    field: "reps" | "weightKg",
    value: string
  ) => void;
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
            <td className="px-3 py-2 text-center">
              {mode === "edit" ? (
                <input
                  type="number"
                  value={getCurrentValue(set, "reps")}
                  onChange={(e) =>
                    onInputChange(set.id, "reps", e.target.value)
                  }
                  className="w-16 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              ) : (
                <span className="text-sm text-slate-600">
                  {set.reps ?? "—"}
                </span>
              )}
            </td>
            <td className="px-3 py-2 text-center">
              {mode === "edit" ? (
                <input
                  type="number"
                  step="0.5"
                  value={getCurrentValue(set, "weightKg")}
                  onChange={(e) =>
                    onInputChange(set.id, "weightKg", e.target.value)
                  }
                  className="w-20 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              ) : (
                <span className="text-sm text-slate-600">
                  {set.weightKg ?? "—"}
                </span>
              )}
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
