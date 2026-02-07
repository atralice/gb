"use client";

import { useState } from "react";
import CreateWeekDialog from "./CreateWeekDialog";

type CreateWeekDialogTriggerProps = {
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
}: CreateWeekDialogTriggerProps) {
  const [open, setOpen] = useState(true);

  return (
    <CreateWeekDialog
      open={open}
      onClose={() => setOpen(false)}
      athleteId={athleteId}
      trainerId={trainerId}
      sourceWeek={sourceWeek}
      targetWeek={targetWeek}
    />
  );
}
