"use client";

import { useState, useTransition } from "react";
import type {
  AthleteWeekData,
  AthleteWeekDay,
  AthleteWeekExercise,
  AthleteWeekSet,
} from "@/lib/trainer/getAthleteWeek";
import { updateSets } from "@/lib/trainer/actions/updateSets";
import { updateBlockSeriesCount } from "@/lib/trainer/actions/updateBlockSeriesCount";

type Props = {
  data: AthleteWeekData;
};

type EditedSet = {
  setId: string;
  reps?: number;
  weightKg?: number;
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
  field: "reps" | "weightKg",
  editedSets: Map<string, EditedSet>
): string {
  const edited = editedSets.get(set.id);
  if (edited && edited[field] !== undefined) {
    return String(edited[field]);
  }
  const original = set[field];
  return original !== null ? String(original) : "";
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

  const hasChanges = editedSets.size > 0;

  const handleInputChange = (
    setId: string,
    field: "reps" | "weightKg",
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseFloat(value);

    setEditedSets((prev) => {
      const next = new Map(prev);
      const existing = next.get(setId) ?? { setId };
      next.set(setId, { ...existing, [field]: numValue });
      return next;
    });
  };

  const handleSave = () => {
    const updates = Array.from(editedSets.values()).filter(
      (u) => u.reps !== undefined || u.weightKg !== undefined
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
    </div>
  );
}

function DayDetail({
  day,
  editedSets,
  onChange,
  onSeriesChange,
  isPending,
}: {
  day: AthleteWeekDay;
  editedSets: Map<string, EditedSet>;
  onChange: (setId: string, field: "reps" | "weightKg", value: string) => void;
  onSeriesChange: (blockId: string, newCount: number) => void;
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
          D&Iacute;A {day.dayIndex}
          {day.label && (
            <span className="ml-2 font-normal text-slate-500">{day.label}</span>
          )}
        </h3>
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
  isPending,
}: {
  block: ExerciseBlock;
  blockIndex: number;
  globalMaxSets: number;
  editedSets: Map<string, EditedSet>;
  onChange: (setId: string, field: "reps" | "weightKg", value: string) => void;
  onSeriesChange: (blockId: string, newCount: number) => void;
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
        const comment = exercise.exerciseComment ?? block.blockComment;

        return (
          <tr
            key={exercise.id}
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
              <span className="flex items-center gap-1">
                {exercise.exerciseName}
                {comment && <CommentTooltip comment={comment} />}
              </span>
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
                      <input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        value={getCurrentValue(set, "weightKg", editedSets)}
                        onChange={(e) =>
                          onChange(set.id, "weightKg", e.target.value)
                        }
                        className="w-16 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    )}
                    {isTimed ? (
                      <span className="text-xs text-slate-500">
                        {set.durationSeconds !== null
                          ? `${set.durationSeconds}s`
                          : "—"}
                      </span>
                    ) : (
                      <input
                        type="number"
                        placeholder="reps"
                        value={getCurrentValue(set, "reps", editedSets)}
                        onChange={(e) =>
                          onChange(set.id, "reps", e.target.value)
                        }
                        className="w-16 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
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
        );
      })}
    </>
  );
}

function CommentTooltip({ comment }: { comment: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="cursor-help text-slate-400 hover:text-slate-600 text-xs">
        &#8505;
      </span>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-slate-800 rounded shadow-lg whitespace-normal max-w-[200px] z-20">
          {comment}
        </span>
      )}
    </span>
  );
}
