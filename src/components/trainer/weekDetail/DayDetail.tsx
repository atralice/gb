"use client";

import type {
  AthleteWeekDay,
  AthleteWeekExercise,
} from "@/lib/trainer/getAthleteWeek";
import type { ExerciseBlock } from "./weekDetailContext";
import { useWeekDetailState, useWeekDetailActions } from "./weekDetailContext";
import BlockRows from "./BlockRows";
import InlineNote from "../InlineNote";

const DAY_LABEL_RE = /^d[iI]a\s+\d+$/i;

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

type Props = {
  day: AthleteWeekDay;
};

export default function DayDetail({ day }: Props) {
  const { localNotes } = useWeekDetailState();
  const { onDayNotesChange } = useWeekDetailActions();
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
