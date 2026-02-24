"use client";

import { useState } from "react";
import CreateWeekDialog from "./CreateWeekDialog";

type Props = {
  athleteId: string;
  trainerId: string;
  sourceWeek: number;
  targetWeek: number;
};

export default function CreateWeekDialogTrigger({
  athleteId,
  trainerId,
  sourceWeek,
  targetWeek,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
      >
        + Semana
      </button>

      <CreateWeekDialog
        open={open}
        onClose={() => setOpen(false)}
        athleteId={athleteId}
        trainerId={trainerId}
        sourceWeek={sourceWeek}
        targetWeek={targetWeek}
      />
    </>
  );
}
