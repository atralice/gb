"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/cn";
import CheckmarkBadge from "@/components/ui/CheckmarkBadge";
import UserMenu from "@/components/ui/UserMenu";

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
  userName?: string | null;
  userEmail: string;
  userRole?: "athlete" | "trainer" | "admin";
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
  userName,
  userEmail,
  userRole,
}: WorkoutHeaderProps) {
  const formattedDate = format(weekStartDate, "d MMM", { locale: es });

  return (
    <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-12">
      <div className="mb-2 flex items-center justify-between">
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
        <UserMenu
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
        />
      </div>

      {/* Block segmented control */}
      <div className="rounded-xl bg-slate-100 p-1">
        <div className="relative flex">
          {/* Sliding background indicator */}
          <div
            className="absolute inset-y-1 rounded-lg bg-white shadow-sm transition-all duration-200 ease-out"
            style={{
              width: `${100 / blocks.length}%`,
              left: `${(activeBlockIndex * 100) / blocks.length}%`,
            }}
          />

          {blocks.map((block, index) => {
            const isActive = activeBlockIndex === index;
            const hasStatus = block.status !== "incomplete";

            return (
              <button
                key={block.id}
                onClick={() => onBlockSelect(index)}
                className={cn(
                  "relative z-10 flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-slate-900"
                    : block.status === "completed"
                      ? "text-emerald-600"
                      : block.status === "skipped" || block.status === "mixed"
                        ? "text-slate-400"
                        : "text-slate-500"
                )}
              >
                <span className="flex items-center justify-center gap-1.5">
                  {block.label || String.fromCharCode(65 + index)}
                  {hasStatus && (
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full",
                        block.status === "completed"
                          ? "bg-emerald-500"
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
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
