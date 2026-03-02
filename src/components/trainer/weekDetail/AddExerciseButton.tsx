"use client";

import { useWeekDetailActions } from "./weekDetailContext";

type Props = {
  blockId: string;
};

export default function AddExerciseButton({ blockId }: Props) {
  const { onAddExercise } = useWeekDetailActions();

  return (
    <button
      onClick={() => onAddExercise(blockId)}
      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
    >
      + Ejercicio
    </button>
  );
}
