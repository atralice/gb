import { cn } from "@/lib/cn";
import { useMemo } from "react";
import { calculateVolumes, getSetColorClasses } from "@/lib/workouts/setColors";
import type { Set } from "@prisma/client";

type SetForDisplay = Pick<
  Set,
  "id" | "setIndex" | "reps" | "weightKg" | "repsPerSide"
>;

type ExerciseSetPillsProps = {
  sets: SetForDisplay[];
};

const ExerciseSetPills = ({ sets }: ExerciseSetPillsProps) => {
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
        const hasWeight = set.weightKg != null && set.weightKg > 0;
        const repsPerSide = set.repsPerSide ? " c/lado" : "";
        const volume = volumes[index] ?? 0;
        const colorClasses = getSetColorClasses(volume, minVolume, maxVolume);

        return (
          <div
            key={set.id}
            className={cn(
              "flex flex-col items-center justify-center rounded px-3 py-2 min-w-[70px]",
              colorClasses
            )}
          >
            <div className="text-2xl font-bold leading-none">
              {set.reps ?? "x"}{" "}
              <span className="text-[8px] opacity-50">{repsPerSide}</span>
            </div>
            {hasWeight && (
              <div className="mt-1 text-xs font-semibold opacity-90">
                {set.weightKg}kg
              </div>
            )}
            {!hasWeight && repsPerSide && (
              <div className="mt-1 text-xs font-semibold opacity-90">
                {repsPerSide.trim()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseSetPills;
