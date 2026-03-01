"use client";

import React, { useState, useTransition } from "react";
import type {
  AthleteWeekData,
  AthleteWeekDay,
  AthleteWeekExercise,
  AthleteWeekSet,
} from "@/lib/trainer/getAthleteWeek";
import { updateSets } from "@/lib/trainer/actions/updateSets";
import { updateBlockSeriesCount } from "@/lib/trainer/actions/updateBlockSeriesCount";
import { updateDayNotes } from "@/lib/trainer/actions/updateDayNotes";
import { updateBlockComment } from "@/lib/trainer/actions/updateBlockComment";
import { updateExerciseComment } from "@/lib/trainer/actions/updateExerciseComment";
import { addExerciseToBlock } from "@/lib/trainer/actions/addExerciseToBlock";
import { removeExerciseFromBlock } from "@/lib/trainer/actions/removeExerciseFromBlock";
import { replaceExercise } from "@/lib/trainer/actions/replaceExercise";
import { reorderExercise } from "@/lib/trainer/actions/reorderExercise";
import { createExercise } from "@/lib/trainer/actions/createExercise";
import { searchExercises } from "@/lib/trainer/searchExercises";
import SetInput from "./SetInput";
import InlineNote from "./InlineNote";
import ExerciseMenu from "./ExerciseMenu";
import ExercisePicker from "./ExercisePicker";

type Props = {
  data: AthleteWeekData;
};

type EditedSet = {
  setId: string;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
};

type ExerciseBlock = {
  blockId: string;
  blockLabel: string;
  blockComment: string | null;
  exercises: AthleteWeekExercise[];
  maxSets: number;
};

function groupExercisesIntoBlocks(
  exercises: AthleteWeekExercise[]
): ExerciseBlock[] {
  const blocks: ExerciseBlock[] = [];
  let current: ExerciseBlock | null = null;

  for (const ex of exercises) {
    if (current && current.blockId === ex.blockId) {
      current.exercises.push(ex);
      current.maxSets = Math.max(current.maxSets, ex.sets.length);
    } else {
      current = {
        blockId: ex.blockId,
        blockLabel: ex.blockLabel,
        blockComment: ex.blockComment,
        exercises: [ex],
        maxSets: ex.sets.length,
      };
      blocks.push(current);
    }
  }

  return blocks;
}

function getCurrentValue(
  set: AthleteWeekSet,
  field: "reps" | "weightKg" | "durationSeconds",
  editedSets: Map<string, EditedSet>
): number | null {
  const edited = editedSets.get(set.id);
  if (edited && edited[field] !== undefined) {
    return edited[field] ?? null;
  }
  return set[field];
}

function exerciseHasWeight(exercise: AthleteWeekExercise): boolean {
  return exercise.sets.some((s) => s.weightKg !== null);
}

function exerciseIsTimed(exercise: AthleteWeekExercise): boolean {
  return exercise.sets.some((s) => s.durationSeconds !== null);
}

export default function WeekDetailTable({ data }: Props) {
  const [editedSets, setEditedSets] = useState<Map<string, EditedSet>>(
    new Map()
  );
  const [isPending, startTransition] = useTransition();
  const [pickerState, setPickerState] = useState<{
    open: boolean;
    mode: "add" | "replace";
    blockId?: string;
    blockExerciseId?: string;
  }>({ open: false, mode: "add" });

  const hasChanges = editedSets.size > 0;

  const handleInputChange = (
    setId: string,
    field: "reps" | "weightKg" | "durationSeconds",
    value: number | null
  ) => {
    setEditedSets((prev) => {
      const next = new Map(prev);
      const existing = next.get(setId) ?? { setId };
      next.set(setId, { ...existing, [field]: value ?? undefined });
      return next;
    });
  };

  const handleSave = () => {
    const updates = Array.from(editedSets.values()).filter(
      (u) =>
        u.reps !== undefined ||
        u.weightKg !== undefined ||
        u.durationSeconds !== undefined
    );

    if (updates.length === 0) return;

    startTransition(async () => {
      await updateSets(updates);
      setEditedSets(new Map());
    });
  };

  const handleSeriesChange = (blockId: string, newCount: number) => {
    if (newCount < 1) return;
    startTransition(async () => {
      await updateBlockSeriesCount(blockId, newCount);
    });
  };

  const handleAddExercise = (blockId: string) => {
    setPickerState({ open: true, mode: "add", blockId });
  };

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

  const handleRemoveExercise = (blockExerciseId: string) => {
    startTransition(async () => {
      await removeExerciseFromBlock(blockExerciseId);
    });
  };

  const handleReplaceExercise = (blockExerciseId: string) => {
    setPickerState({ open: true, mode: "replace", blockExerciseId });
  };

  const handleReorderExercise = (
    exercise: AthleteWeekExercise,
    block: ExerciseBlock,
    exIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? exIndex - 1 : exIndex + 1;
    const target = block.exercises[targetIndex];
    if (!target) return;
    startTransition(async () => {
      await reorderExercise(exercise.id, target.id);
    });
  };

  const handleBlockCommentChange = async (blockId: string, comment: string) => {
    await updateBlockComment(blockId, comment);
  };

  const handleExerciseCommentChange = async (
    blockExerciseId: string,
    comment: string
  ) => {
    await updateExerciseComment(blockExerciseId, comment);
  };

  return (
    <div>
      <div className="space-y-8">
        {data.days.map((day) => (
          <DayDetail
            key={`day-${day.dayIndex}`}
            day={day}
            editedSets={editedSets}
            onChange={handleInputChange}
            onSeriesChange={handleSeriesChange}
            onAddExercise={handleAddExercise}
            onRemoveExercise={handleRemoveExercise}
            onReplaceExercise={handleReplaceExercise}
            onReorderExercise={handleReorderExercise}
            onBlockCommentChange={handleBlockCommentChange}
            onExerciseCommentChange={handleExerciseCommentChange}
            isPending={isPending}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasChanges && !isPending
              ? "bg-slate-800 text-white hover:bg-slate-700"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <ExercisePicker
        open={pickerState.open}
        onClose={() => setPickerState({ open: false, mode: "add" })}
        onSelect={handlePickerSelect}
        searchAction={searchExercises}
        createAction={createExercise}
      />
    </div>
  );
}

function DayDetail({
  day,
  editedSets,
  onChange,
  onSeriesChange,
  onAddExercise,
  onRemoveExercise,
  onReplaceExercise,
  onReorderExercise,
  onBlockCommentChange,
  onExerciseCommentChange,
  isPending,
}: {
  day: AthleteWeekDay;
  editedSets: Map<string, EditedSet>;
  onChange: (
    setId: string,
    field: "reps" | "weightKg" | "durationSeconds",
    value: number | null
  ) => void;
  onSeriesChange: (blockId: string, newCount: number) => void;
  onAddExercise: (blockId: string) => void;
  onRemoveExercise: (blockExerciseId: string) => void;
  onReplaceExercise: (blockExerciseId: string) => void;
  onReorderExercise: (
    exercise: AthleteWeekExercise,
    block: ExerciseBlock,
    exIndex: number,
    direction: "up" | "down"
  ) => void;
  onBlockCommentChange: (blockId: string, comment: string) => Promise<void>;
  onExerciseCommentChange: (
    blockExerciseId: string,
    comment: string
  ) => Promise<void>;
  isPending: boolean;
}) {
  const blocks = groupExercisesIntoBlocks(day.exercises);

  // Determine the global max series count across all blocks for column headers
  const globalMaxSets = blocks.reduce(
    (max, block) => Math.max(max, block.maxSets),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Day header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-900">
          Dia {day.dayIndex}
          {day.label && !/^d[iI]a\s+\d+$/i.test(day.label) && (
            <span className="ml-2 font-normal text-slate-500">
              — {day.label}
            </span>
          )}
        </h3>
        <InlineNote
          value={day.notes ?? null}
          onSave={(v) => updateDayNotes(day.id, v)}
          placeholder="+ nota del dia"
        />
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2 text-xs font-medium text-slate-500 w-16 min-w-[64px]">
                Bloque
              </th>
              <th className="sticky left-16 z-10 bg-slate-50 text-left px-3 py-2 text-xs font-medium text-slate-500 min-w-[140px]">
                Ejercicio
              </th>
              {Array.from({ length: globalMaxSets }, (_, i) => (
                <th
                  key={`serie-${i}`}
                  className="text-center px-3 py-2 text-xs font-medium text-slate-500 min-w-[80px]"
                >
                  Serie {i + 1}
                </th>
              ))}
              <th className="px-3 py-2 text-xs font-medium text-slate-500 w-20 min-w-[80px]" />
            </tr>
          </thead>
          <tbody>
            {blocks.map((block, blockIndex) => (
              <BlockRows
                key={block.blockId}
                block={block}
                blockIndex={blockIndex}
                globalMaxSets={globalMaxSets}
                editedSets={editedSets}
                onChange={onChange}
                onSeriesChange={onSeriesChange}
                onAddExercise={onAddExercise}
                onRemoveExercise={onRemoveExercise}
                onReplaceExercise={onReplaceExercise}
                onReorderExercise={onReorderExercise}
                onBlockCommentChange={onBlockCommentChange}
                onExerciseCommentChange={onExerciseCommentChange}
                isPending={isPending}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlockRows({
  block,
  blockIndex,
  globalMaxSets,
  editedSets,
  onChange,
  onSeriesChange,
  onAddExercise,
  onRemoveExercise,
  onReplaceExercise,
  onReorderExercise,
  onBlockCommentChange,
  onExerciseCommentChange,
  isPending,
}: {
  block: ExerciseBlock;
  blockIndex: number;
  globalMaxSets: number;
  editedSets: Map<string, EditedSet>;
  onChange: (
    setId: string,
    field: "reps" | "weightKg" | "durationSeconds",
    value: number | null
  ) => void;
  onSeriesChange: (blockId: string, newCount: number) => void;
  onAddExercise: (blockId: string) => void;
  onRemoveExercise: (blockExerciseId: string) => void;
  onReplaceExercise: (blockExerciseId: string) => void;
  onReorderExercise: (
    exercise: AthleteWeekExercise,
    block: ExerciseBlock,
    exIndex: number,
    direction: "up" | "down"
  ) => void;
  onBlockCommentChange: (blockId: string, comment: string) => Promise<void>;
  onExerciseCommentChange: (
    blockExerciseId: string,
    comment: string
  ) => Promise<void>;
  isPending: boolean;
}) {
  const isLastExercise = (exIndex: number) =>
    exIndex === block.exercises.length - 1;

  return (
    <>
      {block.exercises.map((exercise, exIndex) => {
        const combinedLabel = `${exercise.blockLabel}${exercise.exerciseOrder}`;
        const hasWeight = exerciseHasWeight(exercise);
        const isTimed = exerciseIsTimed(exercise);

        return (
          <React.Fragment key={exercise.id}>
            {/* Block comment row — only before first exercise */}
            {exIndex === 0 && (
              <tr className="border-b border-slate-100">
                <td className="sticky left-0 z-10 bg-white px-3 py-1" />
                <td colSpan={globalMaxSets + 2} className="px-3 py-1">
                  <InlineNote
                    value={block.blockComment}
                    onSave={(v) => onBlockCommentChange(block.blockId, v)}
                    placeholder="+ nota del bloque"
                  />
                </td>
              </tr>
            )}

            {/* Exercise row */}
            <tr
              className={`border-b border-slate-100 last:border-0 ${
                blockIndex > 0 && exIndex === 0
                  ? "border-t-2 border-t-slate-200"
                  : ""
              }`}
            >
              {/* Bloque column */}
              <td className="sticky left-0 z-10 bg-white px-3 py-2 text-xs font-medium text-slate-500 w-16 align-top">
                {combinedLabel}
              </td>

              {/* Ejercicio column */}
              <td className="sticky left-16 z-10 bg-white px-3 py-2 text-sm text-slate-700 min-w-[140px] align-top">
                <div className="flex items-center gap-1">
                  <span>{exercise.exerciseName}</span>
                  <ExerciseMenu
                    onReplace={() => onReplaceExercise(exercise.id)}
                    onRemove={() => onRemoveExercise(exercise.id)}
                    onMoveUp={
                      exIndex > 0
                        ? () =>
                            onReorderExercise(exercise, block, exIndex, "up")
                        : undefined
                    }
                    onMoveDown={
                      exIndex < block.exercises.length - 1
                        ? () =>
                            onReorderExercise(exercise, block, exIndex, "down")
                        : undefined
                    }
                  />
                </div>
                <InlineNote
                  value={exercise.exerciseComment}
                  onSave={(v) => onExerciseCommentChange(exercise.id, v)}
                  placeholder="+ nota"
                />
              </td>

              {/* Series columns */}
              {Array.from({ length: globalMaxSets }, (_, i) => {
                const set = exercise.sets[i];

                if (!set) {
                  return (
                    <td key={`empty-${i}`} className="px-3 py-2 text-center" />
                  );
                }

                return (
                  <td key={set.id} className="px-3 py-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {hasWeight && (
                        <SetInput
                          value={getCurrentValue(set, "weightKg", editedSets)}
                          unit="kg"
                          step={2.5}
                          min={0}
                          max={500}
                          onChange={(v) => onChange(set.id, "weightKg", v)}
                        />
                      )}
                      {isTimed ? (
                        <SetInput
                          value={getCurrentValue(
                            set,
                            "durationSeconds",
                            editedSets
                          )}
                          unit="s"
                          step={5}
                          min={1}
                          max={600}
                          onChange={(v) =>
                            onChange(set.id, "durationSeconds", v)
                          }
                        />
                      ) : (
                        <SetInput
                          value={getCurrentValue(set, "reps", editedSets)}
                          unit="reps"
                          step={1}
                          min={1}
                          max={100}
                          onChange={(v) => onChange(set.id, "reps", v)}
                        />
                      )}
                    </div>
                  </td>
                );
              })}

              {/* [+][-] buttons column — only on last exercise of block */}
              <td className="px-3 py-2 text-center align-top">
                {isLastExercise(exIndex) && (
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() =>
                        onSeriesChange(block.blockId, block.maxSets - 1)
                      }
                      disabled={isPending || block.maxSets <= 1}
                      className="w-7 h-7 rounded border border-slate-200 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      &minus;
                    </button>
                    <button
                      onClick={() =>
                        onSeriesChange(block.blockId, block.maxSets + 1)
                      }
                      disabled={isPending}
                      className="w-7 h-7 rounded border border-slate-200 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}
              </td>
            </tr>

            {/* "+ Ejercicio" button row — after last exercise in block */}
            {isLastExercise(exIndex) && (
              <tr className="border-b border-slate-100">
                <td className="sticky left-0 z-10 bg-white" />
                <td colSpan={globalMaxSets + 2} className="px-3 py-2">
                  <button
                    onClick={() => onAddExercise(block.blockId)}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    + Ejercicio
                  </button>
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
