"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Command } from "cmdk";
import type { ExerciseType } from "@prisma/client";

type Exercise = {
  id: string;
  name: string;
  exerciseType: string;
  isGlobal: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
  searchAction: (query: string, trainerId?: string) => Promise<Exercise[]>;
  createAction: (params: {
    name: string;
    exerciseType?: ExerciseType;
    ownerId?: string;
  }) => Promise<{ id: string }>;
  copyAction: (
    globalExerciseId: string,
    trainerId: string
  ) => Promise<{ id: string }>;
  trainerId: string;
};

const exerciseTypeLabels: { value: ExerciseType; label: string }[] = [
  { value: "weighted", label: "Peso" },
  { value: "bodyweight", label: "Corporal" },
  { value: "timed", label: "Tiempo" },
];

function ExercisePickerContent({
  onClose,
  onSelect,
  searchAction,
  createAction,
  copyAction,
  trainerId,
}: Omit<Props, "open">) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [isPending, startTransition] = useTransition();
  const [creatingName, setCreatingName] = useState<string | null>(null);

  // Load initial results on mount
  useEffect(() => {
    startTransition(async () => {
      const data = await searchAction("", trainerId);
      setResults(data);
    });
  }, [searchAction, trainerId]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      startTransition(async () => {
        const data = await searchAction(value, trainerId);
        setResults(data);
      });
    },
    [searchAction, trainerId]
  );

  const handleCreate = (exerciseType: ExerciseType) => {
    if (!creatingName) return;
    startTransition(async () => {
      const created = await createAction({
        name: creatingName,
        exerciseType,
        ownerId: trainerId,
      });
      onSelect(created.id);
      onClose();
    });
  };

  const handleGlobalSelect = (globalExerciseId: string) => {
    startTransition(async () => {
      const copy = await copyAction(globalExerciseId, trainerId);
      onSelect(copy.id);
      onClose();
    });
  };

  const hasExactMatch = results.some(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase()
  );

  const ownResults = results.filter((e) => !e.isGlobal);
  const globalResults = results.filter((e) => e.isGlobal);

  // Show type picker if user is creating a new exercise
  if (creatingName) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative w-full max-w-sm mx-4 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden p-4">
          <p className="text-sm text-slate-700 mb-3">
            Tipo de{" "}
            <span className="font-medium">&ldquo;{creatingName}&rdquo;</span>
          </p>
          <div className="flex gap-2">
            {exerciseTypeLabels.map((t) => (
              <button
                key={t.value}
                onClick={() => handleCreate(t.value)}
                disabled={isPending}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCreatingName(null)}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4">
        <Command
          className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
          shouldFilter={false}
        >
          <Command.Input
            value={query}
            onValueChange={handleQueryChange}
            placeholder="Buscar ejercicio..."
            className="w-full px-4 py-3 text-sm border-b border-slate-200 focus:outline-none"
          />
          <Command.List className="max-h-64 overflow-y-auto p-1">
            {isPending && (
              <Command.Loading className="px-4 py-2 text-xs text-slate-400">
                Buscando...
              </Command.Loading>
            )}
            {!isPending && results.length === 0 && query && (
              <Command.Empty className="px-4 py-2 text-xs text-slate-400">
                Sin resultados
              </Command.Empty>
            )}

            {/* Trainer's own exercises */}
            {ownResults.map((exercise) => (
              <Command.Item
                key={exercise.id}
                value={exercise.name}
                onSelect={() => {
                  onSelect(exercise.id);
                  onClose();
                }}
                className="px-4 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100"
              >
                {exercise.name}
              </Command.Item>
            ))}

            {/* Separator + global exercises */}
            {globalResults.length > 0 && ownResults.length > 0 && (
              <div className="px-4 py-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1 pt-2">
                Biblioteca global
              </div>
            )}

            {globalResults.map((exercise) => (
              <Command.Item
                key={exercise.id}
                value={`global-${exercise.name}`}
                onSelect={() => handleGlobalSelect(exercise.id)}
                className="px-4 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100"
              >
                <span className="flex items-center gap-2">
                  {exercise.name}
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    Global
                  </span>
                </span>
              </Command.Item>
            ))}

            {query.trim() && !hasExactMatch && (
              <Command.Item
                value={`create-${query}`}
                onSelect={() => setCreatingName(query.trim())}
                className="px-4 py-2 text-sm text-slate-500 rounded-lg cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100 border-t border-slate-100 mt-1"
              >
                Crear &ldquo;{query.trim()}&rdquo;
              </Command.Item>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

export default function ExercisePicker({ open, ...rest }: Props) {
  if (!open) return null;

  // Mounting/unmounting resets all state naturally
  return <ExercisePickerContent {...rest} />;
}
