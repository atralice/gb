"use client";

import { useState } from "react";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";
import EditableWorkoutCarousel from "./EditableWorkoutCarousel";
import NavButton from "@/components/ui/NavButton";

type WorkoutPlanEditorProps = {
  athleteId: string;
  workoutDays: NonNullable<WorkoutDayWithBlocks>[];
};

const WorkoutPlanEditor = ({
  athleteId: _athleteId,
  workoutDays,
}: WorkoutPlanEditorProps) => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Group workout days by week
  type WorkoutsByWeek = Record<number, NonNullable<WorkoutDayWithBlocks>[]>;
  const initialAcc: WorkoutsByWeek = {};
  const workoutsByWeek = workoutDays.reduce((acc, day) => {
    const week = day.weekNumber;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(day);
    return acc;
  }, initialAcc);

  const weeks = Object.keys(workoutsByWeek)
    .map(Number)
    .sort((a, b) => b - a);

  const selectedWeekDays = selectedWeek
    ? workoutsByWeek[selectedWeek] || []
    : [];

  const selectedWorkoutDay =
    selectedWeek && selectedDayIndex
      ? selectedWeekDays.find((day) => day.dayIndex === selectedDayIndex)
      : null;

  return (
    <div>
      {/* Week selector */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {weeks.map((week) => (
          <NavButton
            key={week}
            isActive={selectedWeek === week}
            onClick={() => {
              setSelectedWeek(week);
              setSelectedDayIndex(null);
            }}
          >
            Semana {week}
          </NavButton>
        ))}
      </div>

      {/* Day selector for selected week */}
      {selectedWeek && selectedWeekDays.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {selectedWeekDays.map((day) => (
            <NavButton
              key={day.id}
              isActive={selectedDayIndex === day.dayIndex}
              onClick={() => setSelectedDayIndex(day.dayIndex)}
            >
              {day.label || `Día ${day.dayIndex}`}
            </NavButton>
          ))}
        </div>
      )}

      {/* Display selected workout day */}
      {selectedWorkoutDay && (
        <div className="mt-4">
          <EditableWorkoutCarousel workoutDay={selectedWorkoutDay} />
        </div>
      )}

      {selectedWeek && selectedWeekDays.length === 0 && (
        <p className="text-sm text-slate-600">
          No hay entrenamientos para esta semana.
        </p>
      )}

      {selectedWeek && !selectedDayIndex && selectedWeekDays.length > 0 && (
        <p className="text-sm text-slate-600">
          Selecciona un día para ver el entrenamiento.
        </p>
      )}

      {!selectedWeek && (
        <p className="text-sm text-slate-600">
          Selecciona una semana para ver los entrenamientos.
        </p>
      )}
    </div>
  );
};

export default WorkoutPlanEditor;
