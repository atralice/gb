"use client";

import { useState } from "react";
import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import Spinner from "@/components/ui/Spinner";
import type { Set as PrismaSet } from "@prisma/client";

type SetForEdit = Pick<
  PrismaSet,
  | "id"
  | "setIndex"
  | "reps"
  | "weightKg"
  | "repsPerSide"
  | "durationSeconds"
  | "actualReps"
  | "actualWeightKg"
  | "actualDurationSeconds"
>;

type SetEditDrawerProps = {
  set: SetForEdit | null;
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    setId: string,
    values: { reps?: number; weightKg?: number; durationSeconds?: number }
  ) => void | Promise<void>;
};

function SetEditForm({
  set,
  exerciseName,
  onOpenChange,
  onSave,
}: {
  set: SetForEdit;
  exerciseName: string;
  onOpenChange: (open: boolean) => void;
  onSave: SetEditDrawerProps["onSave"];
}) {
  // Use logged values if they exist, otherwise fall back to prescription
  const [reps, setReps] = useState<number>(set.actualReps ?? set.reps ?? 1);
  const [weight, setWeight] = useState<number>(
    set.actualWeightKg ?? set.weightKg ?? 0
  );
  const [duration, setDuration] = useState<number>(
    set.actualDurationSeconds ?? set.durationSeconds ?? 30
  );
  const [isSaving, setIsSaving] = useState(false);

  const isTimeBased = set.durationSeconds != null && set.durationSeconds > 0;
  const hasWeight = set.weightKg != null && set.weightKg > 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(set.id, {
        reps: !isTimeBased ? reps : undefined,
        weightKg: hasWeight ? weight : undefined,
        durationSeconds: isTimeBased ? duration : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
    min: number = 0
  ) => {
    setter((prev) => Math.max(min, prev + delta));
  };

  return (
    <>
      <DrawerTitle>
        {exerciseName} - Serie {set.setIndex}
      </DrawerTitle>

      <div className="space-y-6">
        {/* Reps or Duration */}
        {isTimeBased ? (
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-600">
              Duración (segundos)
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => adjustValue(setDuration, -5, 5)}
                disabled={isSaving}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition-colors hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={duration}
                disabled={isSaving}
                onChange={(e) =>
                  setDuration(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-24 rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
              />
              <button
                onClick={() => adjustValue(setDuration, 5)}
                disabled={isSaving}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition-colors hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-600">
              Repeticiones {set.repsPerSide && "(por lado)"}
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => adjustValue(setReps, -1, 1)}
                disabled={isSaving}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition-colors hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={reps}
                disabled={isSaving}
                onChange={(e) =>
                  setReps(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-24 rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
              />
              <button
                onClick={() => adjustValue(setReps, 1)}
                disabled={isSaving}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition-colors hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Weight - only show if the set has weight */}
        {hasWeight && (
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-600">
              Peso (kg)
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => adjustValue(setWeight, -2.5, 0)}
                disabled={isSaving}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition-colors hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
              >
                −
              </button>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                value={weight}
                disabled={isSaving}
                onChange={(e) =>
                  setWeight(Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-24 rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
              />
              <button
                onClick={() => adjustValue(setWeight, 2.5)}
                disabled={isSaving}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition-colors hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
              >
                +
              </button>
            </div>
            {/* Quick weight presets */}
            <div className="mt-3 flex justify-center gap-2">
              {[-5, -2.5, +2.5, +5].map((delta) => (
                <button
                  key={delta}
                  onClick={() => adjustValue(setWeight, delta, 0)}
                  disabled={isSaving}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
          className="flex-1 rounded-xl bg-slate-100 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-wait"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" className="text-white" />
              Guardando...
            </span>
          ) : (
            "Guardar"
          )}
        </button>
      </div>
    </>
  );
}

export default function SetEditDrawer({
  set,
  exerciseName,
  open,
  onOpenChange,
  onSave,
}: SetEditDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {set && (
        <SetEditForm
          key={set.id}
          set={set}
          exerciseName={exerciseName}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      )}
    </Drawer>
  );
}
