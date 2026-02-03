"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import getUser from "@/lib/auth/getUser";
import { AuthorizationError } from "@/types/errors";

const UpdateWorkoutDayNotesSchema = z.object({
  workoutDayId: z.string().uuid(),
  notes: z.string().nullable(),
});

export async function updateWorkoutDayNotes(
  input: z.infer<typeof UpdateWorkoutDayNotesSchema>
) {
  const validated = UpdateWorkoutDayNotesSchema.parse(input);

  // Get current user and verify authorization
  const user = await getUser();
  if (!user) {
    throw new AuthorizationError("Must be authenticated");
  }

  // Verify ownership before updating
  const workoutDay = await prisma.workoutDay.findUniqueOrThrow({
    where: { id: validated.workoutDayId },
    select: { athleteId: true },
  });

  if (workoutDay.athleteId !== user.id) {
    throw new AuthorizationError(
      "Cannot modify workout days for other athletes"
    );
  }

  const updatedWorkoutDay = await prisma.workoutDay.update({
    where: { id: validated.workoutDayId },
    data: { notes: validated.notes },
  });

  return updatedWorkoutDay;
}
