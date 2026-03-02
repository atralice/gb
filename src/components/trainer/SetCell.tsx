"use client";

import { useRef, useCallback } from "react";

type SetCellProps = {
  value: number;
  unit: "kg" | "reps" | "s";
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onDoubleClick: () => void;
};

const unitLabels: Record<string, string> = {
  kg: "kg",
  reps: "reps",
  s: "s",
};

function formatValue(value: number, unit: string): string {
  if (unit === "kg" && value % 1 !== 0) return value.toFixed(1);
  return String(value);
}

export default function SetCell({
  value,
  unit,
  step,
  min,
  max,
  onChange,
  onDoubleClick,
}: SetCellProps) {
  const lastTapRef = useRef(0);

  const handleStep = (direction: 1 | -1) => {
    const next = Math.min(max, Math.max(min, value + step * direction));
    onChange(next);
  };

  const handleValueTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleClick();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleClick]);

  return (
    <div className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          handleStep(-1);
        }}
        className="w-6 h-6 rounded border border-slate-200 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:bg-slate-200 transition-colors flex items-center justify-center select-none"
      >
        &minus;
      </button>
      <button
        type="button"
        onClick={handleValueTap}
        className="min-w-[3rem] px-1 py-1 text-xs text-center tabular-nums select-none"
      >
        <span className="font-medium text-slate-900">
          {formatValue(value, unit)}
        </span>
        <span className="ml-0.5 text-[9px] text-slate-400">
          {unitLabels[unit]}
        </span>
      </button>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          handleStep(1);
        }}
        className="w-6 h-6 rounded border border-slate-200 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:bg-slate-200 transition-colors flex items-center justify-center select-none"
      >
        +
      </button>
    </div>
  );
}
