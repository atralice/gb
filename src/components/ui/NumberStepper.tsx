type NumberStepperProps = {
  label: string;
  value: number;
  step: number;
  min: number;
  max?: number;
  inputMode?: "numeric" | "decimal";
  disabled?: boolean;
  quickAdjust?: number[];
  onChange: (value: number) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function NumberStepper({
  label,
  value,
  step,
  min,
  max = Infinity,
  inputMode = "numeric",
  disabled,
  quickAdjust,
  onChange,
}: NumberStepperProps) {
  const adjust = (delta: number) => {
    onChange(clamp(value + delta, min, max));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed, min, max));
    }
  };

  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-slate-600">
        {label}
      </label>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => adjust(-step)}
          disabled={disabled}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition-colors hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
        >
          −
        </button>
        <input
          type="number"
          inputMode={inputMode}
          step={step}
          min={min}
          max={max === Infinity ? undefined : max}
          value={value}
          disabled={disabled}
          onChange={handleInputChange}
          className="w-24 rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
        />
        <button
          type="button"
          onClick={() => adjust(step)}
          disabled={disabled}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition-colors hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
        >
          +
        </button>
      </div>
      {quickAdjust && (
        <div className="mt-3 flex justify-center gap-2">
          {quickAdjust.map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => adjust(delta)}
              disabled={disabled}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
