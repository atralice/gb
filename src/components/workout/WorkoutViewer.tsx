"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WorkoutHeader from "./WorkoutHeader";
import BlockContent from "./BlockContent";
import DayPickerDrawer from "./DayPickerDrawer";
import ExerciseDetailDrawer from "./ExerciseDetailDrawer";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";
import type { AvailableWorkoutDay } from "@/lib/workouts/getAvailableWorkoutDays";

type WorkoutViewerProps = {
  workoutDay: NonNullable<WorkoutDayWithBlocks>;
  availableDays: AvailableWorkoutDay[];
  initialBlockIndex: number;
  suggestedDay: number;
};

export default function WorkoutViewer({
  workoutDay,
  availableDays,
  initialBlockIndex,
  suggestedDay,
}: WorkoutViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeBlockIndex, setActiveBlockIndex] = useState(initialBlockIndex);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<
    | NonNullable<WorkoutDayWithBlocks>["blocks"][number]["exercises"][number]
    | null
  >(null);

  const blocks = workoutDay.blocks.filter((b) => b.exercises.length > 0);
  const activeBlock = blocks[activeBlockIndex];

  const handleBlockSelect = (index: number) => {
    setActiveBlockIndex(index);
    const params = new URLSearchParams(searchParams.toString());
    params.set("block", index.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const isSuggested = workoutDay.dayIndex === suggestedDay;

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkoutHeader
        dayIndex={workoutDay.dayIndex}
        weekNumber={workoutDay.weekNumber}
        weekStartDate={workoutDay.weekStartDate}
        blocks={blocks}
        activeBlockIndex={activeBlockIndex}
        onBlockSelect={handleBlockSelect}
        onHeaderTap={() => setDayPickerOpen(true)}
        isSuggested={isSuggested}
      />

      {activeBlock && (
        <BlockContent block={activeBlock} onExerciseTap={setSelectedExercise} />
      )}

      <DayPickerDrawer
        open={dayPickerOpen}
        onOpenChange={setDayPickerOpen}
        availableDays={availableDays}
        currentWeek={workoutDay.weekNumber}
        currentDay={workoutDay.dayIndex}
        suggestedDay={suggestedDay}
      />

      <ExerciseDetailDrawer
        exercise={selectedExercise}
        open={!!selectedExercise}
        onOpenChange={(open) => !open && setSelectedExercise(null)}
      />
    </div>
  );
}
