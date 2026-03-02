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
import { useSaveQueue } from "@/hooks/useSaveQueue";
import SetCell from "./SetCell";
import TrainerSetDrawer from "./TrainerSetDrawer";
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

type DrawerState = {
  open: boolean;
  exerciseName: string;
  setIndex: number;
  totalSets: number;
  setId: string;
  inputs: SetInputConfig[];
  values: Record<string, number>;
};

type WeekDetailContextValue = {
  editedSets: Map<string, EditedSet>;
  localNotes: Map<string, string>;
  localBlockComments: Map<string, string>;
  localExerciseComments: Map<string, string>;
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
  onBlockCommentChange: (blockId: string, comment: string) => void;
  onExerciseCommentChange: (blockExerciseId: string, comment: string) => void;
  onDayNotesChange: (dayId: string, notes: string) => void;
  openDrawer: (state: DrawerState) => void;
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

type SetField = "weightKg" | "reps" | "durationSeconds";

type SetInputConfig = {
  field: SetField;
  unit: "kg" | "reps" | "s";
  step: number;
  min: number;
  max: number;
  defaultValue: number;
};

const exerciseInputs: Record<
  "weighted" | "bodyweight" | "timed",
  SetInputConfig[]
> = {
  weighted: [
    {
      field: "weightKg",
      unit: "kg",
      step: 2.5,
      min: 0,
      max: 500,
      defaultValue: 20,
    },
    {
      field: "reps",
      unit: "reps",
      step: 1,
      min: 1,
      max: 100,
      defaultValue: 10,
    },
  ],
  bodyweight: [
    {
      field: "reps",
      unit: "reps",
      step: 1,
      min: 1,
      max: 100,
      defaultValue: 10,
    },
  ],
  timed: [
    {
      field: "durationSeconds",
      unit: "s",
      step: 5,
      min: 1,
      max: 600,
      defaultValue: 30,
    },
  ],
};

function resolveValue(
  sets: AthleteWeekSet[],
  setIndex: number,
  field: SetField,
  editedSets: Map<string, EditedSet>,
  fallbackDefault: number
): number {
  const set = sets[setIndex];
  if (!set) return fallbackDefault;
  // 1. Check edited value
  const edited = editedSets.get(set.id);
  if (edited) {
    const v = edited[field];
    if (v !== undefined) return v ?? fallbackDefault;
  }
  // 2. Check set's own value
  const ownValue = set[field];
  if (ownValue !== null && ownValue !== undefined) return ownValue;
  // 3. Copy from previous set's persisted value (not edited — avoids cascade)
  for (let i = setIndex - 1; i >= 0; i--) {
    const prev = sets[i];
    if (!prev) continue;
    const prevValue = prev[field];
    if (prevValue !== null && prevValue !== undefined) return prevValue;
  }
  // 4. Type default
  return fallbackDefault;
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
  const [localNotes, setLocalNotes] = useState<Map<string, string>>(
    () => new Map()
  );
  const [localBlockComments, setLocalBlockComments] = useState<
    Map<string, string>
  >(() => new Map());
  const [localExerciseComments, setLocalExerciseComments] = useState<
    Map<string, string>
  >(() => new Map());

  const [isPending, startTransition] = useTransition();
  const [pickerState, setPickerState] = useState<{
    open: boolean;
    mode: "add" | "replace";
    blockId?: string;
    blockExerciseId?: string;
  }>({ open: false, mode: "add" });
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);

  const { enqueue, status, lastSavedAt } = useSaveQueue();

  const editedSetsRef = useRef(editedSets);
  useEffect(() => {
    editedSetsRef.current = editedSets;
  }, [editedSets]);

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
    [enqueue]
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
    [enqueue]
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
    [enqueue]
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
    [enqueue]
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

  const openDrawer = useCallback((state: DrawerState) => {
    setDrawerState(state);
  }, []);

  const handleDrawerSave = useCallback(
    (values: Record<string, number>) => {
      if (!drawerState) return;
      for (const input of drawerState.inputs) {
        const value = values[input.field];
        if (value !== undefined) {
          onSetChange(drawerState.setId, input.field, value);
        }
      }
    },
    [drawerState, onSetChange]
  );

  const ctx: WeekDetailContextValue = {
    editedSets,
    localNotes,
    localBlockComments,
    localExerciseComments,
    isPending,
    onSetChange,
    onSeriesChange,
    onAddExercise,
    onRemoveExercise,
    onReplaceExercise,
    onReorder,
    onBlockCommentChange,
    onExerciseCommentChange,
    onDayNotesChange,
    openDrawer,
  };

  return (
    <WeekDetailContext value={ctx}>
      <div>
        {/* Auto-save status indicator — fixed height, always present */}
        <div className="sticky top-0 z-20 flex justify-end px-4 py-2 pointer-events-none h-8">
          <span className="text-xs flex items-center gap-1">
            {status === "saving" && (
              <>
                <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <span className="text-slate-500">Guardando...</span>
              </>
            )}
            {status === "saved" && (
              <span className="text-green-600">&#10003; Guardado</span>
            )}
            {status === "timestamp" && lastSavedAt && (
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
    </WeekDetailContext>
  );
}

// ── DayDetail ──

function DayDetail({ day }: { day: AthleteWeekDay }) {
  const { localNotes, onDayNotesChange } = useWeekDetail();
  const blocks = groupExercisesIntoBlocks(day.exercises);

  const globalMaxSets = blocks.reduce(
    (max, block) => Math.max(max, block.maxSets),
    0
  );

  const notesValue = localNotes.get(day.id) ?? day.notes ?? null;

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
          value={notesValue}
          onSave={(v) => onDayNotesChange(day.id, v)}
          placeholder="+ nota del dia"
        />
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <colgroup>
            <col className="w-16" />
            <col />
            {Array.from({ length: globalMaxSets }, (_, i) => (
              <col
                key={`col-serie-${i}`}
                style={{ width: `${(1 / globalMaxSets) * 60}%` }}
              />
            ))}
            <col className="w-20" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-10 bg-white text-left px-3 py-2 text-xs font-medium text-slate-400">
                Bloque
              </th>
              <th className="sticky left-16 z-10 bg-white text-left px-3 py-2 text-xs font-medium text-slate-400">
                Ejercicio
              </th>
              {Array.from({ length: globalMaxSets }, (_, i) => (
                <th
                  key={`serie-${i}`}
                  className="text-center px-3 py-2 text-xs font-medium text-slate-400"
                >
                  Serie {i + 1}
                </th>
              ))}
              <th className="px-3 py-2 text-xs font-medium text-slate-400" />
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
    localBlockComments,
    localExerciseComments,
    isPending,
    onSetChange,
    onSeriesChange,
    onAddExercise,
    onRemoveExercise,
    onReplaceExercise,
    onReorder,
    onBlockCommentChange,
    onExerciseCommentChange,
    openDrawer,
  } = useWeekDetail();

  const isLastExercise = (exIndex: number) =>
    exIndex === block.exercises.length - 1;

  const rowBg = blockIndex % 2 === 0 ? "bg-white" : "bg-slate-50";

  const blockCommentValue =
    localBlockComments.get(block.blockId) ?? block.blockComment;

  return (
    <>
      {block.exercises.map((exercise, exIndex) => {
        const combinedLabel = `${exercise.blockLabel}${exercise.exerciseOrder}`;
        const inputs = exerciseInputs[exercise.exerciseType];
        const canMoveUp = exIndex > 0;
        const canMoveDown = exIndex < block.exercises.length - 1;

        const exerciseCommentValue =
          localExerciseComments.get(exercise.id) ?? exercise.exerciseComment;

        return (
          <React.Fragment key={exercise.id}>
            {/* Block comment row — only before first exercise */}
            {exIndex === 0 && (
              <tr className={rowBg}>
                <td className={`sticky left-0 z-10 ${rowBg} px-3 py-1`} />
                <td colSpan={globalMaxSets + 2} className="px-3 py-1">
                  <InlineNote
                    value={blockCommentValue}
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
                      {inputs.map((input) => {
                        const resolved = resolveValue(
                          exercise.sets,
                          i,
                          input.field,
                          editedSets,
                          input.defaultValue
                        );
                        return (
                          <SetCell
                            key={input.field}
                            value={resolved}
                            unit={input.unit}
                            step={input.step}
                            min={input.min}
                            max={input.max}
                            onChange={(v) => {
                              // Pin later sibling null sets to their current
                              // resolved values BEFORE applying the edit, so
                              // they don't inherit the new persisted value
                              // after save + refetch.
                              for (
                                let j = i + 1;
                                j < exercise.sets.length;
                                j++
                              ) {
                                const sibling = exercise.sets[j];
                                if (!sibling) continue;
                                if (
                                  sibling[input.field] !== null &&
                                  sibling[input.field] !== undefined
                                )
                                  continue;
                                const siblingEdited = editedSets.get(
                                  sibling.id
                                );
                                if (
                                  siblingEdited &&
                                  siblingEdited[input.field] !== undefined
                                )
                                  continue;
                                const siblingResolved = resolveValue(
                                  exercise.sets,
                                  j,
                                  input.field,
                                  editedSets,
                                  input.defaultValue
                                );
                                onSetChange(
                                  sibling.id,
                                  input.field,
                                  siblingResolved
                                );
                              }
                              onSetChange(set.id, input.field, v);
                            }}
                            onDoubleClick={() => {
                              const allValues: Record<string, number> = {};
                              for (const inp of inputs) {
                                allValues[inp.field] = resolveValue(
                                  exercise.sets,
                                  i,
                                  inp.field,
                                  editedSets,
                                  inp.defaultValue
                                );
                              }
                              openDrawer({
                                open: true,
                                exerciseName: exercise.exerciseName,
                                setIndex: i,
                                totalSets: exercise.sets.length,
                                setId: set.id,
                                inputs,
                                values: allValues,
                              });
                            }}
                          />
                        );
                      })}
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
