import type { Set } from "@prisma/client";

type SetForDisplay = Pick<Set, "reps" | "weightKg">;

// Epley formula to estimate 1RM: 1RM = Weight × (1 + Reps/30)
export function estimate1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

export function calculateSetVolume(set: SetForDisplay): number {
  const weight = set.weightKg ?? 0;
  const reps = set.reps ?? 0;

  if (weight === 0 || reps === 0) {
    return 0;
  }

  return estimate1RM(weight, reps);
}

export function calculateVolumes(sets: SetForDisplay[]): {
  volumes: number[];
  minVolume: number;
  maxVolume: number;
} {
  const volumes = sets.map(calculateSetVolume);
  const nonZeroVolumes = volumes.filter((v) => v > 0);
  const minVolume = nonZeroVolumes.length > 0 ? Math.min(...nonZeroVolumes) : 0;
  const maxVolume = nonZeroVolumes.length > 0 ? Math.max(...nonZeroVolumes) : 0;

  return { volumes, minVolume, maxVolume };
}

const SET_COLOR_CLASSES = [
  "bg-emerald-100 text-emerald-900",
  "bg-yellow-100 text-yellow-900",
  "bg-orange-100 text-orange-900",
  "bg-rose-100 text-rose-900",
] as const;

export function getSetColorClasses(
  volume: number,
  minVolume: number,
  maxVolume: number
): string {
  if (volume === 0) {
    return "bg-slate-100 text-slate-700";
  }

  if (minVolume === maxVolume) {
    return SET_COLOR_CLASSES[0];
  }

  const normalized = ((volume - minVolume) / (maxVolume - minVolume)) * 3;
  const colorIndex = Math.min(Math.floor(normalized), 3);

  return SET_COLOR_CLASSES[colorIndex] ?? SET_COLOR_CLASSES[0];
}
