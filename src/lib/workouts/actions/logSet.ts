"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import getUser from "@/lib/auth/getUser";
import { AuthorizationError } from "@/types/errors";

const LogSetSchema = z.object({
  setId: z.string().uuid(),
  completed: z.boolean(),
  // Optional custom values - if not provided, uses Set's prescription values
  actualReps: z.number().int().positive().nullable().optional(),
  actualWeightKg: z.number().positive().nullable().optional(),
  actualDurationSeconds: z.number().int().positive().nullable().optional(),
});

export async function logSet(input: z.infer<typeof LogSetSchema>) {
  const validated = LogSetSchema.parse(input);

  // Get current user and verify authorization
  const user = await getUser();
  if (!user) {
    throw new AuthorizationError("Must be authenticated");
  }

  // Check if custom values were provided
  const hasCustomValues =
    validated.actualReps !== undefined ||
    validated.actualWeightKg !== undefined ||
    validated.actualDurationSeconds !== undefined;

  if (hasCustomValues) {
    // Custom values provided - update with those values
    const set = await prisma.set.findUniqueOrThrow({
      where: { id: validated.setId },
      include: {
        workoutBlockExercise: {
          include: {
            workoutBlock: {
              include: {
                workoutDay: { select: { athleteId: true } },
              },
            },
          },
        },
      },
    });

    // Verify ownership
    if (
      set.workoutBlockExercise.workoutBlock.workoutDay.athleteId !== user.id
    ) {
      throw new AuthorizationError("Cannot modify sets for other athletes");
    }

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

    await prisma.set.update({
      where: { id: validated.setId },
      data: {
        completed: validated.completed,
        skipped: false, // Completing a set un-skips it
        actualReps,
        actualWeightKg,
        actualDurationSeconds,
        completedAt: validated.completed ? new Date() : null,
      },
    });
  } else {
    // No custom values - only toggle completion
    const set = await prisma.set.findUniqueOrThrow({
      where: { id: validated.setId },
      include: {
        workoutBlockExercise: {
          include: {
            workoutBlock: {
              include: {
                workoutDay: { select: { athleteId: true } },
              },
            },
          },
        },
      },
    });

    // Verify ownership
    if (
      set.workoutBlockExercise.workoutBlock.workoutDay.athleteId !== user.id
    ) {
      throw new AuthorizationError("Cannot modify sets for other athletes");
    }

    // If completing and no actual values set yet, copy from prescription
    const needsDefaults =
      validated.completed && !set.actualReps && !set.actualDurationSeconds;

    await prisma.set.update({
      where: { id: validated.setId },
      data: {
        completed: validated.completed,
        skipped: validated.completed ? false : set.skipped, // Completing un-skips
        completedAt: validated.completed ? new Date() : null,
        ...(needsDefaults && {
          actualReps: set.reps,
          actualWeightKg: set.weightKg,
          actualDurationSeconds: set.durationSeconds,
        }),
      },
    });
  }

  revalidatePath("/[week]/[day]", "page");
}

// Batch version for marking multiple sets complete with defaults
const LogSetsSchema = z.object({
  setIds: z.array(z.string().uuid()),
  completed: z.boolean(),
});

export async function logSets(input: z.infer<typeof LogSetsSchema>) {
  const validated = LogSetsSchema.parse(input);

  // Get current user and verify authorization
  const user = await getUser();
  if (!user) {
    throw new AuthorizationError("Must be authenticated");
  }

  // Get all sets with ownership info
  const sets = await prisma.set.findMany({
    where: { id: { in: validated.setIds } },
    include: {
      workoutBlockExercise: {
        include: {
          workoutBlock: {
            include: {
              workoutDay: { select: { athleteId: true } },
            },
          },
        },
      },
    },
  });

  // Verify all sets belong to the current user
  for (const set of sets) {
    if (
      set.workoutBlockExercise.workoutBlock.workoutDay.athleteId !== user.id
    ) {
      throw new AuthorizationError("Cannot modify sets for other athletes");
    }
  }

  await Promise.all(
    sets.map((set) => {
      // If completing and no actual values set yet, copy from prescription
      const needsDefaults =
        validated.completed && !set.actualReps && !set.actualDurationSeconds;

      return prisma.set.update({
        where: { id: set.id },
        data: {
          completed: validated.completed,
          skipped: validated.completed ? false : set.skipped,
          completedAt: validated.completed ? new Date() : null,
          ...(needsDefaults && {
            actualReps: set.reps,
            actualWeightKg: set.weightKg,
            actualDurationSeconds: set.durationSeconds,
          }),
        },
      });
    })
  );

  revalidatePath("/[week]/[day]", "page");
}

// Skip a single set
const SkipSetSchema = z.object({
  setId: z.string().uuid(),
  skipped: z.boolean(),
});

export async function skipSet(input: z.infer<typeof SkipSetSchema>) {
  const validated = SkipSetSchema.parse(input);

  // Get current user and verify authorization
  const user = await getUser();
  if (!user) {
    throw new AuthorizationError("Must be authenticated");
  }

  // Verify ownership before updating
  const set = await prisma.set.findUniqueOrThrow({
    where: { id: validated.setId },
    include: {
      workoutBlockExercise: {
        include: {
          workoutBlock: {
            include: {
              workoutDay: { select: { athleteId: true } },
            },
          },
        },
      },
    },
  });

  if (set.workoutBlockExercise.workoutBlock.workoutDay.athleteId !== user.id) {
    throw new AuthorizationError("Cannot modify sets for other athletes");
  }

  await prisma.set.update({
    where: { id: validated.setId },
    data: {
      skipped: validated.skipped,
      completed: validated.skipped ? false : undefined, // Skipping uncompletes
      completedAt: validated.skipped ? null : undefined,
    },
  });

  revalidatePath("/[week]/[day]", "page");
}

// Skip multiple sets
const SkipSetsSchema = z.object({
  setIds: z.array(z.string().uuid()),
  skipped: z.boolean(),
});

export async function skipSets(input: z.infer<typeof SkipSetsSchema>) {
  const validated = SkipSetsSchema.parse(input);

  // Get current user and verify authorization
  const user = await getUser();
  if (!user) {
    throw new AuthorizationError("Must be authenticated");
  }

  // Verify all sets belong to the current user before updating
  const sets = await prisma.set.findMany({
    where: { id: { in: validated.setIds } },
    include: {
      workoutBlockExercise: {
        include: {
          workoutBlock: {
            include: {
              workoutDay: { select: { athleteId: true } },
            },
          },
        },
      },
    },
  });

  for (const set of sets) {
    if (
      set.workoutBlockExercise.workoutBlock.workoutDay.athleteId !== user.id
    ) {
      throw new AuthorizationError("Cannot modify sets for other athletes");
    }
  }

  await prisma.set.updateMany({
    where: { id: { in: validated.setIds } },
    data: {
      skipped: validated.skipped,
      completed: validated.skipped ? false : undefined,
      completedAt: validated.skipped ? null : undefined,
    },
  });

  revalidatePath("/[week]/[day]", "page");
}
