"use client";

import { useState } from "react";
import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import type { Set as PrismaSet } from "@prisma/client";

type SetForEdit = Pick<
  PrismaSet,
  "id" | "setIndex" | "reps" | "weightKg" | "repsPerSide" | "durationSeconds"
>;

type SetEditDrawerProps = {
  set: SetForEdit | null;
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    setId: string,
    values: { reps?: number; weightKg?: number; durationSeconds?: number }
  ) => void;
};

// Separate form component to reset state when set changes
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
  const [reps, setReps] = useState<string>(set.reps?.toString() ?? "");
  const [weight, setWeight] = useState<string>(set.weightKg?.toString() ?? "");
  const [duration, setDuration] = useState<string>(
    set.durationSeconds?.toString() ?? ""
  );

  const isTimeBased = set.durationSeconds != null && set.durationSeconds > 0;

  const handleSave = () => {
    onSave(set.id, {
      reps: reps ? parseInt(reps, 10) : undefined,
      weightKg: weight ? parseFloat(weight) : undefined,
      durationSeconds: duration ? parseInt(duration, 10) : undefined,
    });
    onOpenChange(false);
  };

  return (
    <>
      <DrawerTitle>
        {exerciseName} - Serie {set.setIndex}
      </DrawerTitle>

      <div className="space-y-4">
        {isTimeBased ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Duración (segundos)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="40"
            />
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Repeticiones {set.repsPerSide && "(por lado)"}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="8"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Peso (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="20"
          />
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-500">Ajuste rápido</p>
          <div className="flex gap-2">
            {[-5, -2.5, +2.5, +5].map((delta) => (
              <button
                key={delta}
                onClick={() => {
                  const current = parseFloat(weight) || 0;
                  setWeight(Math.max(0, current + delta).toString());
                }}
                className="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                {delta > 0 ? `+${delta}` : delta}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => onOpenChange(false)}
          className="flex-1 rounded-xl bg-slate-100 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-200"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Guardar
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
