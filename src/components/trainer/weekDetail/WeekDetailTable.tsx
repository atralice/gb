"use client";

import { useState, useCallback, useTransition } from "react";
import type { AthleteWeekData } from "@/lib/trainer/getAthleteWeek";
import { addExerciseToBlock } from "@/lib/trainer/actions/addExerciseToBlock";
import { replaceExercise } from "@/lib/trainer/actions/replaceExercise";
import { createExercise } from "@/lib/trainer/actions/createExercise";
import { copyGlobalExercise } from "@/lib/trainer/actions/copyGlobalExercise";
import { searchExercises } from "@/lib/trainer/searchExercises";
import type { EditedSet } from "./resolveValue";
import type { DrawerState, WeekDetailState } from "./weekDetailContext";
import {
  WeekDetailStateContext,
  WeekDetailActionsContext,
} from "./weekDetailContext";
import { useWeekDetailActionsHook } from "./useWeekDetailActions";
import SaveStatus from "./SaveStatus";
import DayDetail from "./DayDetail";
import ExercisePicker from "../ExercisePicker";
import TrainerSetDrawer from "../TrainerSetDrawer";

type PickerState = {
  open: boolean;
  mode: "add" | "replace";
  blockId?: string;
  blockExerciseId?: string;
};

export default function WeekDetailTable({
  data,
  trainerId,
}: {
  data: AthleteWeekData;
  trainerId: string;
}) {
  const [editedSets, setEditedSets] = useState<Map<string, EditedSet>>(
    () => new Map()
  );
  const [localNotes, setLocalNotes] = useState<Map<string, string>>(
    () => new Map()
  );
  const [localBlockComments, setLocalBlockComments] = useState<
    Map<string, string>
  >(() => new Map());
  const [localExerciseComments, setLocalExerciseComments] = useState<
    Map<string, string>
  >(() => new Map());

  const [pickerState, setPickerState] = useState<PickerState>({
    open: false,
    mode: "add",
  });
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);

  const [, startTransition] = useTransition();

  const { actions, isPending, saveStatus } = useWeekDetailActionsHook({
    editedSets,
    setEditedSets,
    setLocalNotes,
    setLocalBlockComments,
    setLocalExerciseComments,
    setPickerState,
    setDrawerState,
  });

  const handlePickerSelect = (exerciseId: string) => {
    startTransition(async () => {
      if (pickerState.mode === "add" && pickerState.blockId) {
        await addExerciseToBlock(pickerState.blockId, exerciseId);
      } else if (
        pickerState.mode === "replace" &&
        pickerState.blockExerciseId
      ) {
        await replaceExercise(pickerState.blockExerciseId, exerciseId);
      }
    });
  };

  const handleDrawerSave = useCallback(
    (values: Record<string, number>) => {
      if (!drawerState) return;
      for (const input of drawerState.inputs) {
        const value = values[input.field];
        if (value !== undefined) {
          actions.onSetChange(drawerState.setId, input.field, value);
        }
      }
    },
    [drawerState, actions]
  );

  const stateValue: WeekDetailState = {
    editedSets,
    localNotes,
    localBlockComments,
    localExerciseComments,
    isPending,
  };

  return (
    <WeekDetailActionsContext value={actions}>
      <WeekDetailStateContext value={stateValue}>
        <div>
          <SaveStatus
            status={saveStatus.status}
            lastSavedAt={saveStatus.lastSavedAt}
          />

          <div className="space-y-8">
            {data.days.map((day) => (
              <DayDetail key={`day-${day.dayIndex}`} day={day} />
            ))}
          </div>

          <ExercisePicker
            open={pickerState.open}
            onClose={() => setPickerState({ open: false, mode: "add" })}
            onSelect={handlePickerSelect}
            searchAction={searchExercises}
            createAction={createExercise}
            copyAction={copyGlobalExercise}
            trainerId={trainerId}
          />

          <TrainerSetDrawer
            open={drawerState?.open ?? false}
            onOpenChange={(open) => {
              if (!open) setDrawerState(null);
            }}
            exerciseName={drawerState?.exerciseName ?? ""}
            setIndex={drawerState?.setIndex ?? 0}
            totalSets={drawerState?.totalSets ?? 0}
            inputs={drawerState?.inputs ?? []}
            values={drawerState?.values ?? {}}
            onSave={handleDrawerSave}
          />
        </div>
      </WeekDetailStateContext>
    </WeekDetailActionsContext>
  );
}
