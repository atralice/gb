"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { copyWeek } from "@/lib/trainer/actions/copyWeek";

type CreateWeekDialogProps = {
  open: boolean;
  onClose: () => void;
  athleteId: string;
  trainerId: string;
  sourceWeek: number;
  targetWeek: number;
};

export default function CreateWeekDialog({
  open,
  onClose,
  athleteId,
  trainerId,
  sourceWeek,
  targetWeek,
}: CreateWeekDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"copy" | "empty">("copy");
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const handleCreate = () => {
    startTransition(async () => {
      await copyWeek(
        athleteId,
        trainerId,
        sourceWeek,
        targetWeek,
        mode === "empty"
      );
      router.push(`/trainer/athletes/${athleteId}?week=${targetWeek}`);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Crear semana {targetWeek}
        </h2>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="mode"
              checked={mode === "copy"}
              onChange={() => setMode("copy")}
              className="w-4 h-4 text-slate-800"
            />
            <span className="text-sm text-slate-700">
              Copiar semana {sourceWeek}
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="mode"
              checked={mode === "empty"}
              onChange={() => setMode("empty")}
              className="w-4 h-4 text-slate-800"
            />
            <span className="text-sm text-slate-700">Crear semana vacía</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {isPending ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
