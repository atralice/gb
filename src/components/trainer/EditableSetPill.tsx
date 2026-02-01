"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { updateSet } from "@/lib/workouts/actions/updateSet";
import type { Set } from "@prisma/client";

type SetForDisplay = Pick<
  Set,
  "id" | "setIndex" | "reps" | "weightKg" | "repsPerSide" | "durationSeconds"
>;

type EditableSetPillProps = {
  set: SetForDisplay;
  colorClasses: string;
};

const EditableSetPill = ({ set, colorClasses }: EditableSetPillProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [reps, setReps] = useState<string>(set.reps?.toString() ?? "");
  const [weightKg, setWeightKg] = useState<string>(
    set.weightKg?.toString() ?? ""
  );
  const [durationSeconds, setDurationSeconds] = useState<string>(
    set.durationSeconds?.toString() ?? ""
  );
  const [repsPerSide, setRepsPerSide] = useState(set.repsPerSide);
  const [isPending, startTransition] = useTransition();

  const hasDuration = set.durationSeconds != null && set.durationSeconds > 0;

  const handleSave = () => {
    startTransition(async () => {
      await updateSet({
        setId: set.id,
        reps: reps ? parseInt(reps, 10) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        durationSeconds: durationSeconds ? parseInt(durationSeconds, 10) : null,
        repsPerSide,
      });
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setReps(set.reps?.toString() ?? "");
    setWeightKg(set.weightKg?.toString() ?? "");
    setDurationSeconds(set.durationSeconds?.toString() ?? "");
    setRepsPerSide(set.repsPerSide);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5 rounded border-2 border-indigo-500 bg-white p-2 min-w-[100px]",
          colorClasses
        )}
      >
        {hasDuration ? (
          <input
            type="number"
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(e.target.value)}
            placeholder="Segundos"
            className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-sm"
            disabled={isPending}
          />
        ) : (
          <>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="Reps"
                className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-sm"
                disabled={isPending}
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={repsPerSide}
                  onChange={(e) => setRepsPerSide(e.target.checked)}
                  disabled={isPending}
                />
                c/lado
              </label>
            </div>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="kg"
              className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-sm"
              disabled={isPending}
            />
          </>
        )}
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 rounded bg-indigo-600 px-1.5 py-0.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex-1 rounded bg-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-400 disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  const hasWeight = set.weightKg != null && set.weightKg > 0;
  const repsPerSideText = set.repsPerSide ? " c/lado" : "";

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "flex flex-col items-center justify-center rounded px-3 py-2 min-w-[70px] transition-all hover:ring-2 hover:ring-indigo-400",
        colorClasses
      )}
    >
      <div className="text-2xl font-bold leading-none">
        {hasDuration ? (
          <>
            {set.durationSeconds}
            <span className="text-sm font-medium">s</span>
          </>
        ) : (
          <>
            {set.reps ?? "x"}
            <span className="text-[8px] opacity-50">{repsPerSideText}</span>
          </>
        )}
      </div>
      {hasWeight && (
        <div className="mt-1 text-xs font-semibold opacity-90">
          {set.weightKg}kg
        </div>
      )}
      {!hasWeight && !hasDuration && repsPerSideText && (
        <div className="mt-1 text-xs font-semibold opacity-90">
          {repsPerSideText.trim()}
        </div>
      )}
    </button>
  );
};

export default EditableSetPill;
