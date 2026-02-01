"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import CheckmarkBadge from "@/components/ui/CheckmarkBadge";
import type { AvailableWorkoutDay } from "@/lib/workouts/getAvailableWorkoutDays";

type DayPickerDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDays: AvailableWorkoutDay[];
  currentWeek: number;
  currentDay: number;
  suggestedDay: number;
};

export default function DayPickerDrawer({
  open,
  onOpenChange,
  availableDays,
  currentWeek,
  currentDay,
  suggestedDay,
}: DayPickerDrawerProps) {
  const router = useRouter();

  // Group days by week
  const weekMap = new Map<
    number,
    { weekStartDate: Date; days: AvailableWorkoutDay[] }
  >();

  for (const day of availableDays) {
    const existing = weekMap.get(day.weekNumber);
    if (existing) {
      existing.days.push(day);
    } else {
      weekMap.set(day.weekNumber, {
        weekStartDate: day.weekStartDate,
        days: [day],
      });
    }
  }

  const weeks = Array.from(weekMap.entries())
    .sort((a, b) => a[1].weekStartDate.getTime() - b[1].weekStartDate.getTime())
    .map(([weekNumber, data]) => ({
      weekNumber,
      weekStartDate: data.weekStartDate,
      days: data.days,
      isCompleted:
        data.days.length > 0 && data.days.every((d) => d.isCompleted),
    }));

  const currentWeekData = weekMap.get(currentWeek);
  const daysInCurrentWeek = currentWeekData?.days ?? [];

  const handleWeekSelect = (weekNumber: number) => {
    const weekData = weekMap.get(weekNumber);
    if (weekData && weekData.days.length > 0) {
      const sortedDays = weekData.days.sort((a, b) => a.dayIndex - b.dayIndex);
      const firstDay = sortedDays[0];
      if (firstDay) {
        router.push(`/${weekNumber}/${firstDay.dayIndex}`);
        onOpenChange(false);
      }
    }
  };

  const handleDaySelect = (dayIndex: number) => {
    router.push(`/${currentWeek}/${dayIndex}`);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTitle>Elegir entrenamiento</DrawerTitle>

      {/* Week selector */}
      <p className="mb-2 text-sm text-slate-500">Semana</p>
      <div className="mb-6 flex gap-2">
        {weeks.map((week) => (
          <button
            key={week.weekNumber}
            onClick={() => handleWeekSelect(week.weekNumber)}
            className={cn(
              "relative flex-1 rounded-xl py-3 text-sm font-medium transition-all",
              currentWeek === week.weekNumber
                ? "bg-slate-800 text-white"
                : week.isCompleted
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <div>Semana {week.weekNumber}</div>
            <div className="text-xs opacity-75">
              {format(week.weekStartDate, "d MMM", { locale: es })}
            </div>
            {week.isCompleted && (
              <CheckmarkBadge size="sm" className="absolute -right-1 -top-1" />
            )}
          </button>
        ))}
      </div>

      {/* Day selector */}
      <p className="mb-2 text-sm text-slate-500">Día</p>
      <div className="flex gap-2">
        {daysInCurrentWeek
          .sort((a, b) => a.dayIndex - b.dayIndex)
          .map((day) => (
            <button
              key={day.id}
              onClick={() => handleDaySelect(day.dayIndex)}
              className={cn(
                "relative flex-1 rounded-xl py-4 text-sm font-medium transition-all",
                currentDay === day.dayIndex
                  ? "bg-slate-800 text-white"
                  : day.isCompleted
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Día {day.dayIndex}
              {day.isCompleted && day.dayIndex !== suggestedDay && (
                <CheckmarkBadge
                  size="sm"
                  className="absolute -right-1 -top-1"
                />
              )}
              {day.dayIndex === suggestedDay &&
                (day.isCompleted ? (
                  <CheckmarkBadge
                    size="md"
                    className="absolute -right-1 -top-1"
                  />
                ) : (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400">
                    <svg
                      className="h-3 w-3 text-amber-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </span>
                ))}
            </button>
          ))}
      </div>
    </Drawer>
  );
}
