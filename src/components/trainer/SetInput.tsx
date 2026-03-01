"use client";

type Props = {
  value: number | null;
  unit: "kg" | "reps" | "s";
  step: number;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
};

const unitConfig = {
  kg: { label: "kg", inputMode: "decimal" as const },
  reps: { label: "reps", inputMode: "numeric" as const },
  s: { label: "s", inputMode: "numeric" as const },
};

export default function SetInput({
  value,
  unit,
  step,
  min,
  max,
  onChange,
}: Props) {
  const config = unitConfig[unit];
  const displayValue = value !== null ? String(value) : "";

  const handleStep = (direction: 1 | -1) => {
    const current = value ?? 0;
    const next = Math.min(max, Math.max(min, current + step * direction));
    onChange(next);
  };

  const handleChange = (raw: string) => {
    if (raw === "") {
      onChange(null);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <div className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          handleStep(-1);
        }}
        className="w-6 h-6 rounded border border-slate-200 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center"
      >
        &minus;
      </button>
      <div className="relative">
        <input
          type="text"
          inputMode={config.inputMode}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="—"
          className="w-14 px-1 py-1 text-xs text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400 tabular-nums"
        />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none">
          {config.label}
        </span>
      </div>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          handleStep(1);
        }}
        className="w-6 h-6 rounded border border-slate-200 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center"
      >
        +
      </button>
    </div>
  );
}
