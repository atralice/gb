"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/cn";
import CheckmarkBadge from "@/components/ui/CheckmarkBadge";

type BlockStatus = "incomplete" | "completed" | "skipped" | "mixed";

type Block = {
  id: string;
  label: string | null;
  order: number;
  status: BlockStatus;
};

type WorkoutHeaderProps = {
  dayIndex: number;
  weekNumber: number;
  weekStartDate: Date;
  blocks: Block[];
  activeBlockIndex: number;
  onBlockSelect: (index: number) => void;
  onHeaderTap: () => void;
  isDayCompleted?: boolean;
};

export default function WorkoutHeader({
  dayIndex,
  weekNumber,
  weekStartDate,
  blocks,
  activeBlockIndex,
  onBlockSelect,
  onHeaderTap,
  isDayCompleted = false,
}: WorkoutHeaderProps) {
  const formattedDate = format(weekStartDate, "d MMM", { locale: es });

  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pb-4 pt-12">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onHeaderTap} className="group flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={cn(
                  "text-2xl font-bold",
                  isDayCompleted ? "text-emerald-700" : "text-slate-900"
                )}
              >
                Día {dayIndex}
              </h1>
              {isDayCompleted && <CheckmarkBadge size="md" />}
            </div>
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
      </div>

      {/* Block pills */}
      <div className="flex gap-3 pt-1">
        {blocks.map((block, index) => {
          const isActive = activeBlockIndex === index;
          const hasStatus = block.status !== "incomplete";

          return (
            <button
              key={block.id}
              onClick={() => onBlockSelect(index)}
              className={cn(
                "relative flex-1 rounded-full py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-slate-800 text-white"
                  : block.status === "completed"
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : block.status === "skipped" || block.status === "mixed"
                      ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {block.label || `Bloque ${index + 1}`}
              {hasStatus && (
                <span
                  className={cn(
                    "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full",
                    block.status === "completed"
                      ? "bg-emerald-600"
                      : "bg-slate-400"
                  )}
                >
                  {block.status === "completed" ? (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : block.status === "skipped" ? (
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
                  ) : (
                    // mixed
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
                        d="M5 12h14"
                      />
                    </svg>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
