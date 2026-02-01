"use client";

import { cn } from "@/lib/cn";
import { useDoubleTap } from "@/hooks/useDoubleTap";
import CheckmarkBadge from "@/components/ui/CheckmarkBadge";

type SetPillProps = {
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
  completed?: boolean;
  onTap?: () => void;
  onDoubleTap?: () => void;
  colorClasses?: string;
};

export default function SetPill({
  reps,
  weightKg,
  durationSeconds,
  repsPerSide,
  completed = false,
  onTap,
  onDoubleTap,
  colorClasses,
}: SetPillProps) {
  const { handleTap } = useDoubleTap({
    onSingleTap: onTap,
    onDoubleTap,
  });

  const isTimeBased = durationSeconds != null && durationSeconds > 0;
  const hasWeight = weightKg != null && weightKg > 0;

  return (
    <button
      onClick={handleTap}
      className={cn(
        "relative flex min-w-16 flex-col items-center justify-center rounded-xl px-4 py-3 transition-all duration-200",
        completed ? "ring-2 ring-emerald-600 ring-offset-1 shadow-md" : "",
        colorClasses || "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
      )}
    >
      {completed && (
        <CheckmarkBadge size="sm" className="absolute -right-0.5 -top-0.5" />
      )}
      <span className="text-2xl font-bold leading-none">
        {isTimeBased ? durationSeconds : (reps ?? "x")}
      </span>
      <span className="mt-0.5 text-xs opacity-75">
        {isTimeBased ? "seg" : repsPerSide ? "c/lado" : "reps"}
      </span>
      {hasWeight && (
        <span className="mt-1 text-xs font-medium">{weightKg}kg</span>
      )}
    </button>
  );
}
