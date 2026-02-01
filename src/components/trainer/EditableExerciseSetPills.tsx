"use client";

import { useMemo } from "react";
import EditableSetPill from "./EditableSetPill";
import { calculateVolumes, getSetColorClasses } from "@/lib/workouts/setColors";
import type { Set } from "@prisma/client";

type SetForDisplay = Pick<
  Set,
  "id" | "setIndex" | "reps" | "weightKg" | "repsPerSide"
>;

type EditableExerciseSetPillsProps = {
  sets: SetForDisplay[];
};

const EditableExerciseSetPills = ({ sets }: EditableExerciseSetPillsProps) => {
  const { volumes, minVolume, maxVolume } = useMemo(
    () => calculateVolumes(sets),
    [sets]
  );

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
