"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/cn";

type Block = {
  id: string;
  label: string | null;
  order: number;
};

type WorkoutHeaderProps = {
  dayIndex: number;
  weekNumber: number;
  weekStartDate: Date;
  blocks: Block[];
  activeBlockIndex: number;
  onBlockSelect: (index: number) => void;
  onHeaderTap: () => void;
  isSuggested?: boolean;
};

export default function WorkoutHeader({
  dayIndex,
  weekNumber,
  weekStartDate,
  blocks,
  activeBlockIndex,
  onBlockSelect,
  onHeaderTap,
  isSuggested = false,
}: WorkoutHeaderProps) {
  const formattedDate = format(weekStartDate, "d MMM", { locale: es });

  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pb-4 pt-12">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onHeaderTap} className="group flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Día {dayIndex}
            </h1>
            <p className="text-sm text-slate-400">
              Semana {weekNumber} · {formattedDate}
            </p>
          </div>
          <svg
            className="h-5 w-5 text-slate-400 transition-colors group-hover:text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </button>

        {isSuggested && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700">
            Sugerido
          </span>
        )}
      </div>

      {/* Block pills */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {blocks.map((block, index) => (
          <button
            key={block.id}
            onClick={() => onBlockSelect(index)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all",
              activeBlockIndex === index
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {block.label || `Bloque ${index + 1}`}
          </button>
        ))}
      </div>
    </header>
  );
}
