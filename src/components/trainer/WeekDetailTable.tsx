"use client";

import React, {
  createContext,
  use,
  useState,
  useRef,
  useCallback,
  useEffect,
  useTransition,
} from "react";
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
import { copyGlobalExercise } from "@/lib/trainer/actions/copyGlobalExercise";
import { searchExercises } from "@/lib/trainer/searchExercises";
import SetInput from "./SetInput";
import InlineNote from "./InlineNote";
import ExerciseMenu from "./ExerciseMenu";
import ExercisePicker from "./ExercisePicker";

const DAY_LABEL_RE = /^d[iI]a\s+\d+$/i;

// ── Types ──

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

// ── Context ──

type WeekDetailContextValue = {
  editedSets: Map<string, EditedSet>;
  isPending: boolean;
  onSetChange: (
    setId: string,
    field: "reps" | "weightKg" | "durationSeconds",
    value: number | null
  ) => void;
  onSeriesChange: (blockId: string, newCount: number) => void;
  onAddExercise: (blockId: string) => void;
  onRemoveExercise: (blockExerciseId: string) => void;
  onReplaceExercise: (blockExerciseId: string) => void;
  onReorder: (exerciseId: string, targetId: string) => void;
  onBlockCommentChange: (blockId: string, comment: string) => Promise<void>;
  onExerciseCommentChange: (
    blockExerciseId: string,
    comment: string
  ) => Promise<void>;
};

const WeekDetailContext = createContext<WeekDetailContextValue | null>(null);

function useWeekDetail() {
  const ctx = use(WeekDetailContext);
  if (!ctx)
    throw new Error("useWeekDetail must be used within WeekDetailTable");
  return ctx;
}

// ── Helpers ──

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
  return (
    exercise.exerciseType === "weighted" || exercise.exerciseType === "timed"
  );
}

function exerciseIsTimed(exercise: AthleteWeekExercise): boolean {
  return exercise.exerciseType === "timed";
}

// ── Root component ──

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
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "timestamp"
  >("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [pickerState, setPickerState] = useState<{
    open: boolean;
    mode: "add" | "replace";
    blockId?: string;
    blockExerciseId?: string;
  }>({ open: false, mode: "add" });

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const editedSetsRef = useRef(editedSets);

  useEffect(() => {
    editedSetsRef.current = editedSets;
  }, [editedSets]);

  const flushSave = useCallback(() => {
    const current = editedSetsRef.current;
    const updates = Array.from(current.values()).filter(
      (u) =>
        u.reps !== undefined ||
        u.weightKg !== undefined ||
        u.durationSeconds !== undefined
    );

    if (updates.length === 0) return;

    setSaveStatus("saving");
    startTransition(async () => {
      await updateSets(updates);
      setEditedSets(new Map());
      setSaveStatus("saved");
      setLastSavedAt(new Date());
      setTimeout(() => setSaveStatus("timestamp"), 2000);
    });
  }, [startTransition]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const current = editedSetsRef.current;
      if (current.size > 0) {
        const updates = Array.from(current.values()).filter(
          (u) =>
            u.reps !== undefined ||
            u.weightKg !== undefined ||
            u.durationSeconds !== undefined
        );
        if (updates.length > 0) {
          void updateSets(updates);
        }
      }
    };
  }, []);

  const onSetChange = useCallback(
    (
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

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        flushSave();
      }, 800);
    },
    [flushSave]
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

  const onAddExercise = useCallback((blockId: string) => {
    setPickerState({ open: true, mode: "add", blockId });
  }, []);

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

  const onRemoveExercise = useCallback(
    (blockExerciseId: string) => {
      startTransition(async () => {
        await removeExerciseFromBlock(blockExerciseId);
      });
    },
    [startTransition]
  );

  const onReplaceExercise = useCallback((blockExerciseId: string) => {
    setPickerState({ open: true, mode: "replace", blockExerciseId });
  }, []);

  const onReorder = useCallback(
    (exerciseId: string, targetId: string) => {
      startTransition(async () => {
        await reorderExercise(exerciseId, targetId);
      });
    },
    [startTransition]
  );

  const onBlockCommentChange = useCallback(
    async (blockId: string, comment: string) => {
      await updateBlockComment(blockId, comment);
    },
    []
  );

  const onExerciseCommentChange = useCallback(
    async (blockExerciseId: string, comment: string) => {
      await updateExerciseComment(blockExerciseId, comment);
    },
    []
  );

  const ctx: WeekDetailContextValue = {
    editedSets,
    isPending,
    onSetChange,
    onSeriesChange,
    onAddExercise,
    onRemoveExercise,
    onReplaceExercise,
    onReorder,
    onBlockCommentChange,
    onExerciseCommentChange,
  };

  return (
    <WeekDetailContext value={ctx}>
      <div>
        {/* Auto-save status indicator — fixed height, always present */}
        <div className="sticky top-0 z-20 flex justify-end px-4 py-2 pointer-events-none h-8">
          <span className="text-xs flex items-center gap-1">
            {saveStatus === "saving" && (
              <>
                <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <span className="text-slate-500">Guardando...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <span className="text-green-600">&#10003; Guardado</span>
            )}
            {saveStatus === "timestamp" && lastSavedAt && (
              <span className="text-slate-400">
                Guardado{" "}
                {lastSavedAt.toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </span>
        </div>

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
      </div>
    </WeekDetailContext>
  );
}

// ── DayDetail ──

function DayDetail({ day }: { day: AthleteWeekDay }) {
  const blocks = groupExercisesIntoBlocks(day.exercises);

  const globalMaxSets = blocks.reduce(
    (max, block) => Math.max(max, block.maxSets),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Day header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-900">
          Dia {day.dayIndex}
          {day.label && !DAY_LABEL_RE.test(day.label) && (
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
          <thead>
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-10 bg-white text-left px-3 py-2 text-xs font-medium text-slate-400 w-16 min-w-[64px]">
                Bloque
              </th>
              <th className="sticky left-16 z-10 bg-white text-left px-3 py-2 text-xs font-medium text-slate-400 min-w-[140px]">
                Ejercicio
              </th>
              {Array.from({ length: globalMaxSets }, (_, i) => (
                <th
                  key={`serie-${i}`}
                  className="text-center px-3 py-2 text-xs font-medium text-slate-400 min-w-[80px]"
                >
                  Serie {i + 1}
                </th>
              ))}
              <th className="px-3 py-2 text-xs font-medium text-slate-400 w-20 min-w-[80px]" />
            </tr>
          </thead>
          <tbody>
            {blocks.map((block, blockIndex) => (
              <BlockRows
                key={block.blockId}
                block={block}
                blockIndex={blockIndex}
                globalMaxSets={globalMaxSets}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── BlockRows ──

function BlockRows({
  block,
  blockIndex,
  globalMaxSets,
}: {
  block: ExerciseBlock;
  blockIndex: number;
  globalMaxSets: number;
}) {
  const {
    editedSets,
    isPending,
    onSetChange,
    onSeriesChange,
    onAddExercise,
    onRemoveExercise,
    onReplaceExercise,
    onReorder,
    onBlockCommentChange,
    onExerciseCommentChange,
  } = useWeekDetail();

  const isLastExercise = (exIndex: number) =>
    exIndex === block.exercises.length - 1;

  const rowBg = blockIndex % 2 === 0 ? "bg-white" : "bg-slate-50";

  return (
    <>
      {block.exercises.map((exercise, exIndex) => {
        const combinedLabel = `${exercise.blockLabel}${exercise.exerciseOrder}`;
        const hasWeight = exerciseHasWeight(exercise);
        const isTimed = exerciseIsTimed(exercise);
        const canMoveUp = exIndex > 0;
        const canMoveDown = exIndex < block.exercises.length - 1;

        return (
          <React.Fragment key={exercise.id}>
            {/* Block comment row — only before first exercise */}
            {exIndex === 0 && (
              <tr className={rowBg}>
                <td className={`sticky left-0 z-10 ${rowBg} px-3 py-1`} />
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
              className={`${rowBg} ${
                blockIndex > 0 && exIndex === 0
                  ? "border-t border-slate-200"
                  : ""
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
                className={`sticky left-16 z-10 ${rowBg} px-3 py-2 text-sm text-slate-900 min-w-[140px] align-top`}
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
                          onChange={(v) => onSetChange(set.id, "weightKg", v)}
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
                            onSetChange(set.id, "durationSeconds", v)
                          }
                        />
                      ) : (
                        <SetInput
                          value={getCurrentValue(set, "reps", editedSets)}
                          unit="reps"
                          step={1}
                          min={1}
                          max={100}
                          onChange={(v) => onSetChange(set.id, "reps", v)}
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
              <tr className={rowBg}>
                <td className={`sticky left-0 z-10 ${rowBg}`} />
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
