"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const UpsertSetLogSchema = z.object({
  setId: z.string().uuid(),
  completed: z.boolean(),
  // Optional custom values - if not provided, uses Set's default values
  actualReps: z.number().int().positive().nullable().optional(),
  actualWeightKg: z.number().positive().nullable().optional(),
  actualDurationSeconds: z.number().int().positive().nullable().optional(),
});

export async function upsertSetLog(input: z.infer<typeof UpsertSetLogSchema>) {
  const validated = UpsertSetLogSchema.parse(input);

  // Get the Set to use as defaults if no custom values provided
  const set = await prisma.set.findUniqueOrThrow({
    where: { id: validated.setId },
  });

  const actualReps =
    validated.actualReps !== undefined ? validated.actualReps : set.reps;
  const actualWeightKg =
    validated.actualWeightKg !== undefined
      ? validated.actualWeightKg
      : set.weightKg;
  const actualDurationSeconds =
    validated.actualDurationSeconds !== undefined
      ? validated.actualDurationSeconds
      : set.durationSeconds;

  await prisma.setLog.upsert({
    where: { setId: validated.setId },
    create: {
      setId: validated.setId,
      completed: validated.completed,
      actualReps,
      actualWeightKg,
      actualDurationSeconds,
    },
    update: {
      completed: validated.completed,
      actualReps,
      actualWeightKg,
      actualDurationSeconds,
      completedAt: validated.completed ? new Date() : undefined,
    },
  });

  revalidatePath("/[week]/[day]", "page");
}

// Batch version for marking multiple sets complete with defaults
const UpsertSetLogsSchema = z.object({
  setIds: z.array(z.string().uuid()),
  completed: z.boolean(),
});

export async function upsertSetLogs(
  input: z.infer<typeof UpsertSetLogsSchema>
) {
  const validated = UpsertSetLogsSchema.parse(input);

  // Get all sets to use as defaults
  const sets = await prisma.set.findMany({
    where: { id: { in: validated.setIds } },
  });

  await Promise.all(
    sets.map((set) =>
      prisma.setLog.upsert({
        where: { setId: set.id },
        create: {
          setId: set.id,
          completed: validated.completed,
          actualReps: set.reps,
          actualWeightKg: set.weightKg,
          actualDurationSeconds: set.durationSeconds,
        },
        update: {
          completed: validated.completed,
          actualReps: set.reps,
          actualWeightKg: set.weightKg,
          actualDurationSeconds: set.durationSeconds,
          completedAt: validated.completed ? new Date() : undefined,
        },
      })
    )
  );

  revalidatePath("/[week]/[day]", "page");
}
