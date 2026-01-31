import { cn } from "@/lib/cn";
import { useMemo } from "react";

type Set = {
  id: string;
  setIndex: number;
  reps: number | null;
  weightKg: number | null;
  repsPerSide: boolean;
};

type ExerciseSetPillsProps = {
  sets: Set[];
};

// Epley formula to estimate 1RM: 1RM = Weight × (1 + Reps/30)
// Higher 1RM = higher difficulty
function estimate1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

// Color scheme based on estimated 1RM (same 1RM = same color)
// 4-color progression: Green (low) → Yellow → Orange → Red (high)
const getSetColorClasses = (
  volume: number,
  minVolume: number,
  maxVolume: number
) => {
  // For bodyweight exercises (volume = 0), use a neutral color
  if (volume === 0) {
    return "bg-slate-100 text-slate-700";
  }

  // If all volumes are the same, use green
  if (minVolume === maxVolume) {
    return "bg-emerald-100 text-emerald-900";
  }

  // Normalize volume to 0-3 range based on min/max
  const normalized = ((volume - minVolume) / (maxVolume - minVolume)) * 3;
  const colorIndex = Math.min(Math.floor(normalized), 3);

  const colorMap = [
    "bg-emerald-100 text-emerald-900", // Green - low volume
    "bg-yellow-100 text-yellow-900", // Yellow - medium-low
    "bg-orange-100 text-orange-900", // Orange - medium
    "bg-rose-100 text-rose-900", // Red - high
  ];

  return colorMap[colorIndex];
};

const ExerciseSetPills = ({ sets }: ExerciseSetPillsProps) => {
  // Calculate estimated 1RM values and min/max for normalization
  // This properly reflects difficulty - 35kg × 2 reps is harder than 25kg × 5 reps
  const { volumes, minVolume, maxVolume } = useMemo(() => {
    const volumes = sets.map((set) => {
      const weight = set.weightKg ?? 0;
      const reps = set.reps ?? 0;

      // For bodyweight exercises, use 0 as volume
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
            {/* Reps - Large and prominent */}
            <div className="text-2xl font-bold leading-none">
              {set.reps ?? "x"}{" "}
              <span className="text-[8px] opacity-50">{repsPerSide}</span>
            </div>
            {/* Weight - Smaller below */}
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
