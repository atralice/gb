"use client";

import { useState, useRef } from "react";
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

  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant and significant
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0 && activeBlockIndex > 0) {
        // Swipe right - go to previous block
        handleBlockSelect(activeBlockIndex - 1);
      } else if (deltaX < 0 && activeBlockIndex < blocks.length - 1) {
        // Swipe left - go to next block
        handleBlockSelect(activeBlockIndex + 1);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

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

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="min-h-[calc(100vh-120px)]"
      >
        {activeBlock && (
          <BlockContent
            block={activeBlock}
            onExerciseTap={setSelectedExercise}
          />
        )}
      </div>

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
