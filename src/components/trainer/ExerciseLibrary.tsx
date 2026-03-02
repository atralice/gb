"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TrainerExercise } from "@/lib/trainer/getTrainerExercises";
import type { ExerciseType } from "@prisma/client";
import { bulkUpdateExerciseType } from "@/lib/trainer/actions/bulkUpdateExerciseType";
import ExerciseEditModal from "./ExerciseEditModal";

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

const bulkTypeActions: { value: ExerciseType; label: string }[] = [
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
  const [editingExercise, setEditingExercise] =
    useState<TrainerExercise | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkTypeChange = (type: ExerciseType) => {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      await bulkUpdateExerciseType(ids, type);
      setSelectedIds(new Set());
      router.refresh();
    });
  };

  const isSelectMode = selectedIds.size > 0;

  return (
    <div className="p-4 space-y-4 pb-24">
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
              className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors"
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => toggleSelect(exercise.id)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  selectedIds.has(exercise.id)
                    ? "border-slate-900 bg-slate-900"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                {selectedIds.has(exercise.id) && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              {/* Exercise info */}
              <button
                type="button"
                onClick={() =>
                  isSelectMode
                    ? toggleSelect(exercise.id)
                    : setEditingExercise(exercise)
                }
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {exercise.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {typeLabels[exercise.exerciseType] ??
                        exercise.exerciseType}
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
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {exercise.instructions}
                  </p>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sticky bottom action bar for bulk type change */}
      {isSelectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 && "s"}
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>
            <div className="flex gap-2">
              {bulkTypeActions.map((action) => (
                <button
                  key={action.value}
                  onClick={() => handleBulkTypeChange(action.value)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise}
          open={!!editingExercise}
          onClose={() => setEditingExercise(null)}
        />
      )}
    </div>
  );
}
