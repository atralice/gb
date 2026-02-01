"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WorkoutHeader from "./WorkoutHeader";
import BlockContent from "./BlockContent";
import DayPickerDrawer from "./DayPickerDrawer";
import ExerciseDetailDrawer from "./ExerciseDetailDrawer";
import SetEditDrawer from "./SetEditDrawer";
import {
  upsertSetLog,
  upsertSetLogs,
} from "@/lib/workouts/actions/upsertSetLog";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";
import type { AvailableWorkoutDay } from "@/lib/workouts/getAvailableWorkoutDays";

type SetForEdit =
  NonNullable<WorkoutDayWithBlocks>["blocks"][number]["exercises"][number]["sets"][number];

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
  const [selectedSet, setSelectedSet] = useState<{
    set: SetForEdit;
    exerciseName: string;
    allSets: SetForEdit[];
  } | null>(null);

  const blocks = workoutDay.blocks
    .filter((b) => b.exercises.length > 0)
    .sort((a, b) => {
      // Warm-up blocks come first
      const aIsWarmup =
        a.label?.toLowerCase().includes("warm") ||
        a.label?.toLowerCase().includes("calentamiento");
      const bIsWarmup =
        b.label?.toLowerCase().includes("warm") ||
        b.label?.toLowerCase().includes("calentamiento");
      if (aIsWarmup && !bIsWarmup) return -1;
      if (!aIsWarmup && bIsWarmup) return 1;
      // Then sort by order
      return a.order - b.order;
    });
  const activeBlock = blocks[activeBlockIndex];

  // Compute block completion status
  const isBlockCompleted = (block: (typeof blocks)[number]) => {
    const allSets = block.exercises.flatMap((e) => e.sets);
    return allSets.length > 0 && allSets.every((s) => s.log?.completed);
  };

  const blocksWithCompletion = blocks.map((block) => ({
    id: block.id,
    label: block.label,
    order: block.order,
    isCompleted: isBlockCompleted(block),
  }));

  const isDayCompleted =
    blocks.length > 0 && blocks.every((b) => isBlockCompleted(b));

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
        blocks={blocksWithCompletion}
        activeBlockIndex={activeBlockIndex}
        onBlockSelect={handleBlockSelect}
        onHeaderTap={() => setDayPickerOpen(true)}
        isSuggested={isSuggested}
        isDayCompleted={isDayCompleted}
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
            onSetDoubleTap={(set, exerciseName, allSets) =>
              setSelectedSet({ set, exerciseName, allSets })
            }
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

      <SetEditDrawer
        set={selectedSet?.set ?? null}
        exerciseName={selectedSet?.exerciseName ?? ""}
        open={!!selectedSet}
        onOpenChange={(open) => !open && setSelectedSet(null)}
        onSave={async (setId, values) => {
          if (!selectedSet) return;

          // Find the index of this set
          const setIndex = selectedSet.allSets.findIndex((s) => s.id === setId);
          const previousSetIds = selectedSet.allSets
            .slice(0, setIndex)
            .filter((s) => !s.log?.completed)
            .map((s) => s.id);

          // Complete this set with custom values, and previous sets with defaults
          await Promise.all([
            upsertSetLog({
              setId,
              completed: true,
              actualReps: values.reps ?? null,
              actualWeightKg: values.weightKg ?? null,
              actualDurationSeconds: values.durationSeconds ?? null,
            }),
            previousSetIds.length > 0
              ? upsertSetLogs({ setIds: previousSetIds, completed: true })
              : Promise.resolve(),
          ]);
          router.refresh();
        }}
      />
    </div>
  );
}
