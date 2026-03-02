"use client";

import { useCallback, useRef, useEffect, useTransition, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { updateSets } from "@/lib/trainer/actions/updateSets";
import { updateBlockSeriesCount } from "@/lib/trainer/actions/updateBlockSeriesCount";
import { updateDayNotes } from "@/lib/trainer/actions/updateDayNotes";
import { updateBlockComment } from "@/lib/trainer/actions/updateBlockComment";
import { updateExerciseComment } from "@/lib/trainer/actions/updateExerciseComment";
import { removeExerciseFromBlock } from "@/lib/trainer/actions/removeExerciseFromBlock";
import { reorderExercise } from "@/lib/trainer/actions/reorderExercise";
import { useSaveQueue } from "@/hooks/useSaveQueue";
import type { EditedSet, SetField } from "./resolveValue";
import type { WeekDetailActions, DrawerState } from "./weekDetailContext";

type PickerState = {
  open: boolean;
  mode: "add" | "replace";
  blockId?: string;
  blockExerciseId?: string;
};

export function useWeekDetailActionsHook({
  editedSets,
  setEditedSets,
  setLocalNotes,
  setLocalBlockComments,
  setLocalExerciseComments,
  setPickerState,
  setDrawerState,
}: {
  editedSets: Map<string, EditedSet>;
  setEditedSets: Dispatch<SetStateAction<Map<string, EditedSet>>>;
  setLocalNotes: Dispatch<SetStateAction<Map<string, string>>>;
  setLocalBlockComments: Dispatch<SetStateAction<Map<string, string>>>;
  setLocalExerciseComments: Dispatch<SetStateAction<Map<string, string>>>;
  setPickerState: Dispatch<SetStateAction<PickerState>>;
  setDrawerState: Dispatch<SetStateAction<DrawerState | null>>;
}): {
  actions: WeekDetailActions;
  isPending: boolean;
  saveStatus: { status: string; lastSavedAt: Date | null };
} {
  const { enqueue, status, lastSavedAt } = useSaveQueue();
  const [isPending, startTransition] = useTransition();

  const editedSetsRef = useRef(editedSets);
  useEffect(() => {
    editedSetsRef.current = editedSets;
  }, [editedSets]);

  // ── Callbacks ──

  const onSetChange = useCallback(
    (setId: string, field: SetField, value: number | null) => {
      setEditedSets((prev) => {
        const next = new Map(prev);
        const existing = next.get(setId) ?? { setId };
        next.set(setId, { ...existing, [field]: value ?? undefined });
        return next;
      });

      enqueue("sets", async () => {
        const current = editedSetsRef.current;
        const updates = Array.from(current.values()).filter(
          (u) =>
            u.reps !== undefined ||
            u.weightKg !== undefined ||
            u.durationSeconds !== undefined
        );
        if (updates.length === 0) return;
        await updateSets(updates);
      });
    },
    [setEditedSets, enqueue]
  );

  const onDayNotesChange = useCallback(
    (dayId: string, notes: string) => {
      setLocalNotes((prev) => {
        const next = new Map(prev);
        next.set(dayId, notes);
        return next;
      });

      enqueue(`dayNotes:${dayId}`, async () => {
        await updateDayNotes(dayId, notes);
      });
    },
    [setLocalNotes, enqueue]
  );

  const onBlockCommentChange = useCallback(
    (blockId: string, comment: string) => {
      setLocalBlockComments((prev) => {
        const next = new Map(prev);
        next.set(blockId, comment);
        return next;
      });

      enqueue(`blockComment:${blockId}`, async () => {
        await updateBlockComment(blockId, comment);
      });
    },
    [setLocalBlockComments, enqueue]
  );

  const onExerciseCommentChange = useCallback(
    (blockExerciseId: string, comment: string) => {
      setLocalExerciseComments((prev) => {
        const next = new Map(prev);
        next.set(blockExerciseId, comment);
        return next;
      });

      enqueue(`exerciseComment:${blockExerciseId}`, async () => {
        await updateExerciseComment(blockExerciseId, comment);
      });
    },
    [setLocalExerciseComments, enqueue]
  );

  const onSeriesChange = useCallback(
    (blockId: string, newCount: number) => {
      if (newCount < 1) return;
      startTransition(async () => {
        await updateBlockSeriesCount(blockId, newCount);
      });
    },
    [startTransition]
  );

  const onAddExercise = useCallback(
    (blockId: string) => {
      setPickerState({ open: true, mode: "add", blockId });
    },
    [setPickerState]
  );

  const onRemoveExercise = useCallback(
    (blockExerciseId: string) => {
      startTransition(async () => {
        await removeExerciseFromBlock(blockExerciseId);
      });
    },
    [startTransition]
  );

  const onReplaceExercise = useCallback(
    (blockExerciseId: string) => {
      setPickerState({ open: true, mode: "replace", blockExerciseId });
    },
    [setPickerState]
  );

  const onReorder = useCallback(
    (exerciseId: string, targetId: string) => {
      startTransition(async () => {
        await reorderExercise(exerciseId, targetId);
      });
    },
    [startTransition]
  );

  const openDrawer = useCallback(
    (state: DrawerState) => {
      setDrawerState(state);
    },
    [setDrawerState]
  );

  // ── Stable actions object ──

  const actions: WeekDetailActions = useMemo(
    () => ({
      onSetChange,
      onDayNotesChange,
      onBlockCommentChange,
      onExerciseCommentChange,
      onSeriesChange,
      onAddExercise,
      onRemoveExercise,
      onReplaceExercise,
      onReorder,
      openDrawer,
    }),
    [
      onSetChange,
      onDayNotesChange,
      onBlockCommentChange,
      onExerciseCommentChange,
      onSeriesChange,
      onAddExercise,
      onRemoveExercise,
      onReplaceExercise,
      onReorder,
      openDrawer,
    ]
  );

  return {
    actions,
    isPending,
    saveStatus: { status, lastSavedAt },
  };
}
