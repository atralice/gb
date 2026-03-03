"use client";

import React from "react";
import type { AthleteWeekExercise } from "@/lib/trainer/getAthleteWeek";
import { exerciseInputs } from "./resolveValue";
import type { ExerciseBlock } from "./weekDetailContext";
import { useWeekDetailState, useWeekDetailActions } from "./weekDetailContext";
import SetCellGroup from "./SetCellGroup";
import SeriesControls from "./SeriesControls";
import AddExerciseButton from "./AddExerciseButton";
import InlineNote from "../InlineNote";
import ExerciseMenu from "../ExerciseMenu";

type Props = {
  exercise: AthleteWeekExercise;
  exIndex: number;
  block: ExerciseBlock;
  globalMaxSets: number;
  rowBg: string;
  blockIndex: number;
};

export default function ExerciseRow({
  exercise,
  exIndex,
  block,
  globalMaxSets,
  rowBg,
  blockIndex,
}: Props) {
  const { localExerciseComments } = useWeekDetailState();
  const {
    onReorder,
    onRemoveExercise,
    onReplaceExercise,
    onExerciseCommentChange,
  } = useWeekDetailActions();

  const combinedLabel = `${exercise.blockLabel}${exercise.exerciseOrder}`;
  const inputs = exerciseInputs[exercise.exerciseType];
  const canMoveUp = exIndex > 0;
  const canMoveDown = exIndex < block.exercises.length - 1;
  const isLastExercise = exIndex === block.exercises.length - 1;

  const exerciseCommentValue =
    localExerciseComments.get(exercise.id) ?? exercise.exerciseComment;

  return (
    <React.Fragment>
      {/* Exercise row */}
      <tr
        className={`${rowBg} ${
          blockIndex > 0 && exIndex === 0 ? "border-t border-slate-200" : ""
        }`}
      >
        {/* Bloque column */}
        <td
          className={`sticky left-0 z-10 ${rowBg} px-3 py-2 text-xs font-medium text-slate-900 w-16 align-top`}
        >
          {combinedLabel}
        </td>

        {/* Ejercicio column */}
        <td
          className={`sticky left-16 z-10 ${rowBg} px-3 py-2 text-sm text-slate-900 align-top`}
        >
          <div className="flex items-center gap-1">
            {(canMoveUp || canMoveDown) && (
              <span className="flex flex-col mr-0.5">
                <button
                  onClick={() => {
                    const target = block.exercises[exIndex - 1];
                    if (target) onReorder(exercise.id, target.id);
                  }}
                  disabled={!canMoveUp}
                  className="text-[10px] leading-none text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors"
                  aria-label="Mover arriba"
                >
                  &#9650;
                </button>
                <button
                  onClick={() => {
                    const target = block.exercises[exIndex + 1];
                    if (target) onReorder(exercise.id, target.id);
                  }}
                  disabled={!canMoveDown}
                  className="text-[10px] leading-none text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors"
                  aria-label="Mover abajo"
                >
                  &#9660;
                </button>
              </span>
            )}
            <span>{exercise.exerciseName}</span>
            <ExerciseMenu
              onReplace={() => onReplaceExercise(exercise.id)}
              onRemove={() => onRemoveExercise(exercise.id)}
            />
          </div>
          <InlineNote
            value={exerciseCommentValue}
            onSave={(v) => onExerciseCommentChange(exercise.id, v)}
            placeholder="+ nota"
          />
        </td>

        {/* Set cells */}
        <SetCellGroup
          exercise={exercise}
          globalMaxSets={globalMaxSets}
          inputs={inputs}
        />

        {/* [+][-] buttons column — only on last exercise of block */}
        <td className="px-3 py-2 text-center align-top">
          {isLastExercise && (
            <SeriesControls blockId={block.blockId} maxSets={block.maxSets} />
          )}
        </td>
      </tr>

      {/* "+ Ejercicio" button row — after last exercise in block */}
      {isLastExercise && (
        <tr className={rowBg}>
          <td className={`sticky left-0 z-10 ${rowBg}`} />
          <td colSpan={globalMaxSets + 2} className="px-3 py-2">
            <AddExerciseButton blockId={block.blockId} />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
