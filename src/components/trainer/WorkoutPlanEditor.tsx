"use client";

import { useState } from "react";
import type { WorkoutDayWithExercises } from "@/lib/workouts/getWorkoutDay";
import EditableWorkoutCarousel from "./EditableWorkoutCarousel";

type WorkoutPlanEditorProps = {
  athleteId: string;
  workoutDays: NonNullable<WorkoutDayWithExercises>[];
};

const WorkoutPlanEditor = ({
  athleteId,
  workoutDays,
}: WorkoutPlanEditorProps) => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Group workout days by week
  const workoutsByWeek = workoutDays.reduce((acc, day) => {
    const week = day.weekNumber;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(day);
    return acc;
  }, {} as Record<number, NonNullable<WorkoutDayWithExercises>[]>);

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
          <button
            key={week}
            onClick={() => {
              setSelectedWeek(week);
              setSelectedDayIndex(null);
            }}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              selectedWeek === week
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semana {week}
          </button>
        ))}
      </div>

      {/* Day selector for selected week */}
      {selectedWeek && selectedWeekDays.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {selectedWeekDays.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayIndex(day.dayIndex)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                selectedDayIndex === day.dayIndex
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {day.label || `Día ${day.dayIndex}`}
            </button>
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
