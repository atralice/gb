"use client";

import { useMemo } from "react";
import EditableSetPill from "./EditableSetPill";
import type { Set } from "@prisma/client";

type SetForDisplay = Pick<
  Set,
  "id" | "setIndex" | "reps" | "weightKg" | "repsPerSide"
>;

type EditableExerciseSetPillsProps = {
  sets: SetForDisplay[];
};

// Epley formula to estimate 1RM: 1RM = Weight × (1 + Reps/30)
function estimate1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

const getSetColorClasses = (
  volume: number,
  minVolume: number,
  maxVolume: number
) => {
  if (volume === 0) {
    return "bg-slate-100 text-slate-700";
  }

  if (minVolume === maxVolume) {
    return "bg-emerald-100 text-emerald-900";
  }

  const normalized = ((volume - minVolume) / (maxVolume - minVolume)) * 3;
  const colorIndex = Math.min(Math.floor(normalized), 3);

  const colorMap = [
    "bg-emerald-100 text-emerald-900",
    "bg-yellow-100 text-yellow-900",
    "bg-orange-100 text-orange-900",
    "bg-rose-100 text-rose-900",
  ] as const;

  return colorMap[colorIndex] ?? colorMap[0];
};

const EditableExerciseSetPills = ({ sets }: EditableExerciseSetPillsProps) => {
  const { volumes, minVolume, maxVolume } = useMemo(() => {
    const volumes = sets.map((set) => {
      const weight = set.weightKg ?? 0;
      const reps = set.reps ?? 0;

      if (weight === 0 || reps === 0) {
        return 0;
      }

      return estimate1RM(weight, reps);
    });
    const nonZeroVolumes = volumes.filter((v) => v > 0);
    const minVolume =
      nonZeroVolumes.length > 0 ? Math.min(...nonZeroVolumes) : 0;
    const maxVolume =
      nonZeroVolumes.length > 0 ? Math.max(...nonZeroVolumes) : 0;

    return { volumes, minVolume, maxVolume };
  }, [sets]);

  if (sets.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sets.map((set, index) => {
        const volume = volumes[index] ?? 0;
        const colorClasses = getSetColorClasses(volume, minVolume, maxVolume);

        return (
          <EditableSetPill key={set.id} set={set} colorClasses={colorClasses} />
        );
      })}
    </div>
  );
};

export default EditableExerciseSetPills;
