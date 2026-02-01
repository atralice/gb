"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
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

  const weeks = Array.from(weekMap.entries()).sort(
    (a, b) => b[1].weekStartDate.getTime() - a[1].weekStartDate.getTime()
  );

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
        {weeks.map(([weekNumber, data]) => (
          <button
            key={weekNumber}
            onClick={() => handleWeekSelect(weekNumber)}
            className={cn(
              "flex-1 rounded-xl py-3 text-sm font-medium transition-all",
              currentWeek === weekNumber
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <div>Semana {weekNumber}</div>
            <div className="text-xs opacity-75">
              {format(data.weekStartDate, "d MMM", { locale: es })}
            </div>
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
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Día {day.dayIndex}
              {day.dayIndex === suggestedDay && (
                <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-1.5 py-0.5 text-xs text-amber-900">
                  Sugerido
                </span>
              )}
            </button>
          ))}
      </div>
    </Drawer>
  );
}
