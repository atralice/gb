"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TrainerExercise } from "@/lib/trainer/getTrainerExercises";

const typeLabels: Record<string, string> = {
  weighted: "Peso",
  bodyweight: "Corporal",
  timed: "Tiempo",
};

const typeFilters = [
  { value: "", label: "Todos" },
  { value: "weighted", label: "Peso" },
  { value: "bodyweight", label: "Corporal" },
  { value: "timed", label: "Tiempo" },
];

type Props = {
  exercises: TrainerExercise[];
};

export default function ExerciseLibrary({ exercises }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? ""
  );

  const activeType = searchParams.get("type") ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/trainer/exercises?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="p-4 space-y-4">
      {/* Search bar */}
      <input
        type="text"
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          updateParams("search", e.target.value);
        }}
        placeholder="Buscar ejercicio..."
        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
      />

      {/* Type filter */}
      <div className="flex gap-2">
        {typeFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => updateParams("type", f.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              activeType === f.value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          No hay ejercicios
        </p>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {exercise.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {typeLabels[exercise.exerciseType] ?? exercise.exerciseType}
                    {exercise.tags.length > 0 && (
                      <span> · {exercise.tags.join(", ")}</span>
                    )}
                  </p>
                </div>
                {exercise.globalSourceId && (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    Copiado
                  </span>
                )}
              </div>
              {exercise.instructions && (
                <p className="text-xs text-slate-500 mt-1">
                  {exercise.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
