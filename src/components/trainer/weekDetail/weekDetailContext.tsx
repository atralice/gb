// src/components/trainer/weekDetail/weekDetailContext.tsx
"use client";

import { createContext, use } from "react";
import type { AthleteWeekExercise } from "@/lib/trainer/getAthleteWeek";
import type { EditedSet, SetField, SetInputConfig } from "./resolveValue";

export type DrawerState = {
  open: boolean;
  exerciseName: string;
  setIndex: number;
  totalSets: number;
  setId: string;
  inputs: SetInputConfig[];
  values: Record<string, number>;
};

export type ExerciseBlock = {
  blockId: string;
  blockLabel: string;
  blockComment: string | null;
  exercises: AthleteWeekExercise[];
  maxSets: number;
};

// STATE — changes on every edit
export type WeekDetailState = {
  editedSets: Map<string, EditedSet>;
  localNotes: Map<string, string>;
  localBlockComments: Map<string, string>;
  localExerciseComments: Map<string, string>;
  isPending: boolean;
};

// ACTIONS — stable, never changes identity
export type WeekDetailActions = {
  onSetChange: (setId: string, field: SetField, value: number | null) => void;
  onSeriesChange: (blockId: string, newCount: number) => void;
  onAddExercise: (blockId: string) => void;
  onRemoveExercise: (blockExerciseId: string) => void;
  onReplaceExercise: (blockExerciseId: string) => void;
  onReorder: (exerciseId: string, targetId: string) => void;
  onBlockCommentChange: (blockId: string, comment: string) => void;
  onExerciseCommentChange: (blockExerciseId: string, comment: string) => void;
  onDayNotesChange: (dayId: string, notes: string) => void;
  openDrawer: (state: DrawerState) => void;
};

export const WeekDetailStateContext = createContext<WeekDetailState | null>(
  null
);
export const WeekDetailActionsContext = createContext<WeekDetailActions | null>(
  null
);

export function useWeekDetailState(): WeekDetailState {
  const ctx = use(WeekDetailStateContext);
  if (!ctx)
    throw new Error("useWeekDetailState must be used within WeekDetailTable");
  return ctx;
}

export function useWeekDetailActions(): WeekDetailActions {
  const ctx = use(WeekDetailActionsContext);
  if (!ctx)
    throw new Error("useWeekDetailActions must be used within WeekDetailTable");
  return ctx;
}
