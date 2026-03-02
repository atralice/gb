"use client";

import { useState } from "react";
import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import NumberStepper from "@/components/ui/NumberStepper";
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
  exerciseType: "weighted" | "bodyweight" | "timed";
  totalSets: number;
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
  exerciseType,
  totalSets,
  onOpenChange,
  onSave,
}: {
  set: SetForEdit;
  exerciseName: string;
  exerciseType: "weighted" | "bodyweight" | "timed";
  totalSets: number;
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

  const isTimeBased = exerciseType === "timed";
  const hasWeight = exerciseType === "weighted";

  // Format prescription text
  const getPrescriptionText = () => {
    const parts: string[] = [];
    if (isTimeBased) {
      parts.push(`${set.durationSeconds}s`);
    } else {
      parts.push(`${set.reps} reps${set.repsPerSide ? " c/lado" : ""}`);
    }
    if (hasWeight) {
      parts.push(`@ ${set.weightKg}kg`);
    }
    return parts.join(" ");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(set.id, {
        reps: exerciseType !== "timed" ? reps : undefined,
        weightKg: exerciseType === "weighted" ? weight : undefined,
        durationSeconds: exerciseType === "timed" ? duration : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DrawerTitle>
        {exerciseName} - Serie {set.setIndex} de {totalSets}
      </DrawerTitle>

      {/* Prescription display */}
      <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-center">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Prescrito
        </span>
        <p className="mt-0.5 text-lg font-semibold text-slate-700">
          {getPrescriptionText()}
        </p>
      </div>

      <div className="space-y-6">
        {isTimeBased ? (
          <NumberStepper
            label="Duración (segundos)"
            value={duration}
            step={5}
            min={1}
            disabled={isSaving}
            onChange={setDuration}
          />
        ) : (
          <NumberStepper
            label={`Repeticiones${set.repsPerSide ? " (por lado)" : ""}`}
            value={reps}
            step={1}
            min={1}
            disabled={isSaving}
            onChange={setReps}
          />
        )}

        {hasWeight && (
          <NumberStepper
            label="Peso (kg)"
            value={weight}
            step={2.5}
            min={0}
            inputMode="decimal"
            disabled={isSaving}
            quickAdjust={[-5, -2.5, 2.5, 5]}
            onChange={setWeight}
          />
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
  exerciseType,
  totalSets,
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
          exerciseType={exerciseType}
          totalSets={totalSets}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      )}
    </Drawer>
  );
}
