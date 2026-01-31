"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const UpdateWorkoutDayNotesSchema = z.object({
  workoutDayId: z.string().uuid(),
  notes: z.string().nullable(),
});

export async function updateWorkoutDayNotes(
  input: z.infer<typeof UpdateWorkoutDayNotesSchema>
) {
  const validated = UpdateWorkoutDayNotesSchema.parse(input);

  const workoutDay = await prisma.workoutDay.update({
    where: { id: validated.workoutDayId },
    data: { notes: validated.notes },
  });

  return workoutDay;
}
