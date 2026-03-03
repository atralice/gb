"use client";

import type { ExerciseBlock } from "./weekDetailContext";
import { useWeekDetailState, useWeekDetailActions } from "./weekDetailContext";
import ExerciseRow from "./ExerciseRow";
import InlineNote from "../InlineNote";

type Props = {
  block: ExerciseBlock;
  blockIndex: number;
  globalMaxSets: number;
};

export default function BlockRows({ block, blockIndex, globalMaxSets }: Props) {
  const { localBlockComments } = useWeekDetailState();
  const { onBlockCommentChange } = useWeekDetailActions();

  const rowBg = blockIndex % 2 === 0 ? "bg-white" : "bg-slate-50";
  const blockCommentValue =
    localBlockComments.get(block.blockId) ?? block.blockComment;

  return (
    <>
      {/* Block comment row — before first exercise */}
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

      {block.exercises.map((exercise, exIndex) => (
        <ExerciseRow
          key={exercise.id}
          exercise={exercise}
          exIndex={exIndex}
          block={block}
          globalMaxSets={globalMaxSets}
          rowBg={rowBg}
          blockIndex={blockIndex}
        />
      ))}
    </>
  );
}
