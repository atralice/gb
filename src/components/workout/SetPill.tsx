"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

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
  const lastTapRef = useRef(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTap?.();
    } else {
      onTap?.();
    }
    lastTapRef.current = now;
  };

  const isTimeBased = durationSeconds != null && durationSeconds > 0;
  const hasWeight = weightKg != null && weightKg > 0;

  return (
    <button
      onClick={handleTap}
      className={cn(
        "flex min-w-16 flex-col items-center justify-center rounded-xl px-4 py-3 transition-all duration-200",
        completed
          ? "bg-emerald-500 text-white shadow-md"
          : colorClasses ||
              "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
      )}
    >
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
