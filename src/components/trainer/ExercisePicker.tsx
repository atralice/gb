"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Command } from "cmdk";

type Exercise = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
  searchAction: (query: string) => Promise<Exercise[]>;
  createAction: (name: string) => Promise<{ id: string }>;
};

function ExercisePickerContent({
  onClose,
  onSelect,
  searchAction,
  createAction,
}: Omit<Props, "open">) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [isPending, startTransition] = useTransition();

  // Load initial results on mount
  useEffect(() => {
    startTransition(async () => {
      const data = await searchAction("");
      setResults(data);
    });
  }, [searchAction]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      startTransition(async () => {
        const data = await searchAction(value);
        setResults(data);
      });
    },
    [searchAction]
  );

  const handleCreate = () => {
    if (!query.trim()) return;
    startTransition(async () => {
      const created = await createAction(query.trim());
      onSelect(created.id);
      onClose();
    });
  };

  const hasExactMatch = results.some(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase()
  );

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
            {results.map((exercise) => (
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
            {query.trim() && !hasExactMatch && (
              <Command.Item
                value={`create-${query}`}
                onSelect={handleCreate}
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
