"use client";

import { useWeekDetailState, useWeekDetailActions } from "./weekDetailContext";

type Props = {
  blockId: string;
  maxSets: number;
};

export default function SeriesControls({ blockId, maxSets }: Props) {
  const { isPending } = useWeekDetailState();
  const { onSeriesChange } = useWeekDetailActions();

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onSeriesChange(blockId, maxSets - 1)}
        disabled={isPending || maxSets <= 1}
        className="w-7 h-7 rounded border border-slate-200 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        &minus;
      </button>
      <button
        onClick={() => onSeriesChange(blockId, maxSets + 1)}
        disabled={isPending}
        className="w-7 h-7 rounded border border-slate-200 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
    </div>
  );
}
