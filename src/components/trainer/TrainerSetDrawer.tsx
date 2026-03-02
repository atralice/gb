"use client";

import { useState, useEffect } from "react";
import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import NumberStepper from "@/components/ui/NumberStepper";

type SetField = "weightKg" | "reps" | "durationSeconds";

type SetInputConfig = {
  field: SetField;
  unit: "kg" | "reps" | "s";
  step: number;
  min: number;
  max: number;
  defaultValue: number;
};

type TrainerSetDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  setIndex: number;
  totalSets: number;
  inputs: SetInputConfig[];
  values: Record<string, number>;
  onSave: (values: Record<string, number>) => void;
};

const quickAdjust: Record<"kg" | "reps" | "s", number[]> = {
  kg: [-5, -2.5, 2.5, 5],
  reps: [-5, -1, 1, 5],
  s: [-15, -5, 5, 15],
};

const fieldLabels: Record<string, string> = {
  weightKg: "Peso (kg)",
  reps: "Repeticiones",
  durationSeconds: "Duración (s)",
};

function TrainerSetDrawerForm({
  exerciseName,
  setIndex,
  totalSets,
  inputs,
  values,
  onSave,
  onOpenChange,
}: Omit<TrainerSetDrawerProps, "open">) {
  const [localValues, setLocalValues] =
    useState<Record<string, number>>(values);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleDone = () => {
    onSave(localValues);
    onOpenChange(false);
  };

  return (
    <>
      <DrawerTitle>
        {exerciseName} — Serie {setIndex + 1} de {totalSets}
      </DrawerTitle>

      <div className="space-y-6">
        {inputs.map((input) => {
          const val = localValues[input.field] ?? input.defaultValue;

          return (
            <NumberStepper
              key={input.field}
              label={fieldLabels[input.field] ?? input.field}
              value={val}
              step={input.step}
              min={input.min}
              max={input.max}
              inputMode={input.unit === "kg" ? "decimal" : "numeric"}
              quickAdjust={quickAdjust[input.unit]}
              onChange={(v) =>
                setLocalValues((prev) => ({ ...prev, [input.field]: v }))
              }
            />
          );
        })}
      </div>

      {/* Done button */}
      <div className="mt-8">
        <button
          onClick={handleDone}
          className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Listo
        </button>
      </div>
    </>
  );
}

export default function TrainerSetDrawer({
  open,
  onOpenChange,
  exerciseName,
  setIndex,
  totalSets,
  inputs,
  values,
  onSave,
}: TrainerSetDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {open && (
        <TrainerSetDrawerForm
          key={`${setIndex}-${Object.values(values).join("-")}`}
          exerciseName={exerciseName}
          setIndex={setIndex}
          totalSets={totalSets}
          inputs={inputs}
          values={values}
          onSave={onSave}
          onOpenChange={onOpenChange}
        />
      )}
    </Drawer>
  );
}
