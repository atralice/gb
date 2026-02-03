"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import CheckmarkBadge from "@/components/ui/CheckmarkBadge";

type SetPillProps = {
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
  completed?: boolean;
  skipped?: boolean;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  colorClasses?: string;
};

const DOUBLE_TAP_DELAY = 250;
const LONG_PRESS_THRESHOLD = 500;

export default function SetPill({
  reps,
  weightKg,
  durationSeconds,
  repsPerSide,
  completed = false,
  skipped = false,
  onTap,
  onDoubleTap,
  onLongPress,
  colorClasses,
}: SetPillProps) {
  // Combined tap, double-tap, and long-press detection
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isLongPressRef = useRef(false);
  const didMoveRef = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const clearTimers = useCallback(() => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const touch = e.touches[0];
      if (touch) {
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      }
      isLongPressRef.current = false;
      didMoveRef.current = false;

      // Start long press timer
      longPressTimeoutRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        tapCountRef.current = 0;
        clearTimers();
        onLongPress?.();
      }, LONG_PRESS_THRESHOLD);
    },
    [onLongPress, clearTimers]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Cancel long press and mark as scroll if finger moves too much
      const touch = e.touches[0];
      if (touch && touchStartPos.current) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);
        if (dx > 10 || dy > 10) {
          didMoveRef.current = true;
          clearTimers();
        }
      }
    },
    [clearTimers]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault(); // Prevent click event

      // Clear long press timer
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }

      // If it was a long press or finger moved (scrolling), don't handle tap
      if (isLongPressRef.current || didMoveRef.current) {
        isLongPressRef.current = false;
        didMoveRef.current = false;
        tapCountRef.current = 0;
        return;
      }

      // Handle tap/double-tap
      tapCountRef.current += 1;

      if (tapCountRef.current === 1) {
        tapTimeoutRef.current = setTimeout(() => {
          if (tapCountRef.current === 1) {
            onTap?.();
          }
          tapCountRef.current = 0;
        }, DOUBLE_TAP_DELAY);
      } else if (tapCountRef.current === 2) {
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
        tapCountRef.current = 0;
        onDoubleTap?.();
      }
    },
    [onTap, onDoubleTap]
  );

  // Click handler for desktop (fallback)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Handle tap/double-tap on click
      tapCountRef.current += 1;

      if (tapCountRef.current === 1) {
        tapTimeoutRef.current = setTimeout(() => {
          if (tapCountRef.current === 1) {
            onTap?.();
          }
          tapCountRef.current = 0;
        }, DOUBLE_TAP_DELAY);
      } else if (tapCountRef.current === 2) {
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
        tapCountRef.current = 0;
        onDoubleTap?.();
      }
    },
    [onTap, onDoubleTap]
  );

  const isTimeBased = durationSeconds != null && durationSeconds > 0;
  const hasWeight = weightKg != null && weightKg > 0;

  // Determine visual state classes
  const getStateClasses = () => {
    if (skipped) {
      return "bg-slate-200 text-slate-500";
    }
    if (completed) {
      return cn(
        "ring-2 ring-emerald-600 ring-offset-1 shadow-md",
        colorClasses || "bg-emerald-100 text-emerald-900"
      );
    }
    return (
      colorClasses || "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
    );
  };

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={clearTimers}
      onClick={handleClick}
      className={cn(
        "relative flex min-w-16 flex-col items-center justify-center rounded-xl px-4 py-3 transition-all duration-200",
        getStateClasses()
      )}
    >
      {/* Completed badge */}
      {completed && !skipped && (
        <CheckmarkBadge size="sm" className="absolute -right-0.5 -top-0.5" />
      )}

      {/* Skipped badge */}
      {skipped && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-400">
          <svg
            className="h-2.5 w-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </span>
      )}

      <span
        className={cn(
          "text-2xl font-bold leading-none",
          skipped && "line-through"
        )}
      >
        {isTimeBased ? durationSeconds : (reps ?? "x")}
      </span>
      <span className="mt-0.5 text-xs opacity-75">
        {isTimeBased ? "seg" : repsPerSide ? "c/lado" : "reps"}
      </span>
      {hasWeight && (
        <span
          className={cn("mt-1 text-xs font-medium", skipped && "line-through")}
        >
          {weightKg}kg
        </span>
      )}
    </button>
  );
}
