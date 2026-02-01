"use client";

import { useRouter, useSearchParams } from "next/navigation";
import NavButton from "@/components/ui/NavButton";
import type { AvailableWorkoutDay } from "@/lib/workouts/getAvailableWorkoutDays";

type WorkoutDaySelectorProps = {
  availableDays: AvailableWorkoutDay[];
  currentWeek: number;
  currentDay: number;
};

const WorkoutDaySelector = ({
  availableDays,
  currentWeek,
  currentDay,
}: WorkoutDaySelectorProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Group days by week
  const weeks = [...new Set(availableDays.map((d) => d.weekNumber))].sort(
    (a, b) => b - a
  );
  const daysInCurrentWeek = availableDays.filter(
    (d) => d.weekNumber === currentWeek
  );

  const navigateTo = (week: number, day: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", week.toString());
    params.set("day", day.toString());
    router.push(`?${params.toString()}`);
  };

  const handleWeekChange = (week: number) => {
    const firstDayInWeek = availableDays.find((d) => d.weekNumber === week);
    if (firstDayInWeek) {
      navigateTo(week, firstDayInWeek.dayIndex);
    }
  };

  return (
    <div className="space-y-2">
      {/* Week selector */}
      <div className="flex flex-wrap gap-1.5">
        {weeks.map((week) => (
          <NavButton
            key={week}
            isActive={currentWeek === week}
            onClick={() => handleWeekChange(week)}
          >
            Semana {week}
          </NavButton>
        ))}
      </div>

      {/* Day selector */}
      {daysInCurrentWeek.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {daysInCurrentWeek.map((day) => (
            <NavButton
              key={day.id}
              isActive={currentDay === day.dayIndex}
              onClick={() => navigateTo(currentWeek, day.dayIndex)}
            >
              {day.label || `Día ${day.dayIndex}`}
            </NavButton>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutDaySelector;
