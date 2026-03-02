"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GlobalExercise } from "@/lib/admin/getGlobalExercises";
import type { ExerciseType } from "@prisma/client";
import { updateExercise } from "@/lib/admin/actions/updateExercise";
import { deleteExercise } from "@/lib/admin/actions/deleteExercise";
import { createExercise } from "@/lib/trainer/actions/createExercise";

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

const exerciseTypes: { value: ExerciseType; label: string }[] = [
  { value: "weighted", label: "Peso" },
  { value: "bodyweight", label: "Corporal" },
  { value: "timed", label: "Tiempo" },
];

type Props = {
  exercises: GlobalExercise[];
};

type EditForm = {
  name: string;
  exerciseType: ExerciseType;
  instructions: string;
  tags: string;
};

export default function AdminExerciseList({ exercises }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? ""
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    exerciseType: "weighted",
    instructions: "",
    tags: "",
  });
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState<EditForm>({
    name: "",
    exerciseType: "weighted",
    instructions: "",
    tags: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeType = searchParams.get("type") ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/admin/exercises?${params.toString()}`);
    },
    [router, searchParams]
  );

  const startEdit = (exercise: GlobalExercise) => {
    setEditingId(exercise.id);
    setEditForm({
      name: exercise.name,
      exerciseType: exercise.exerciseType,
      instructions: exercise.instructions ?? "",
      tags: exercise.tags.join(", "),
    });
  };

  const handleSave = () => {
    if (!editingId) return;
    startTransition(async () => {
      await updateExercise(editingId, {
        name: editForm.name,
        exerciseType: editForm.exerciseType,
        instructions: editForm.instructions || null,
        tags: editForm.tags
          ? editForm.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      });
      setEditingId(null);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteExercise(id);
      setConfirmDeleteId(null);
    });
  };

  const handleCreate = () => {
    startTransition(async () => {
      await createExercise({
        name: newForm.name,
        exerciseType: newForm.exerciseType,
      });
      setCreating(false);
      setNewForm({
        name: "",
        exerciseType: "weighted",
        instructions: "",
        tags: "",
      });
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            updateParams("search", e.target.value);
          }}
          placeholder="Buscar ejercicio..."
          className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
        />
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          + Nuevo
        </button>
      </div>

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

      {/* Create form */}
      {creating && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-900">Nuevo ejercicio</p>
          <input
            type="text"
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            placeholder="Nombre"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
          />
          <div className="flex gap-2">
            {exerciseTypes.map((t) => (
              <button
                key={t.value}
                onClick={() =>
                  setNewForm({ ...newForm, exerciseType: t.value })
                }
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  newForm.exerciseType === t.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isPending || !newForm.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Crear
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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
              {editingId === exercise.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                  <div className="flex gap-2">
                    {exerciseTypes.map((t) => (
                      <button
                        key={t.value}
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            exerciseType: t.value,
                          })
                        }
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          editForm.exerciseType === t.value
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={editForm.instructions}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        instructions: e.target.value,
                      })
                    }
                    placeholder="Instrucciones"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tags: e.target.value })
                    }
                    placeholder="Tags (separados por coma)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(exercise)}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Editar
                      </button>
                      {confirmDeleteId === exercise.id ? (
                        <span className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(exercise.id)}
                            disabled={isPending}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(exercise.id)}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                  {exercise.instructions && (
                    <p className="text-xs text-slate-500 mt-1">
                      {exercise.instructions}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
