"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function copyWeek(
  athleteId: string,
  trainerId: string,
  sourceWeek: number,
  targetWeek: number,
  empty: boolean
): Promise<{ weekNumber: number }> {
  const sourceDays = await prisma.workoutDay.findMany({
    where: { athleteId, weekNumber: sourceWeek },
    include: {
      blocks: {
        include: {
          exercises: {
            include: { sets: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { dayIndex: "asc" },
  });

  if (sourceDays.length === 0) {
    throw new Error("Source week not found");
  }

  // Calculate new week start date (7 days after source)
  const sourceWeekStart = sourceDays[0]?.weekStartDate ?? new Date();
  const weeksDiff = targetWeek - sourceWeek;
  const targetWeekStart = new Date(sourceWeekStart);
  targetWeekStart.setDate(targetWeekStart.getDate() + weeksDiff * 7);

  // Create new days
  for (const sourceDay of sourceDays) {
    const newDay = await prisma.workoutDay.create({
      data: {
        trainerId,
        athleteId,
        weekNumber: targetWeek,
        weekStartDate: targetWeekStart,
        dayIndex: sourceDay.dayIndex,
        label: sourceDay.label,
        notes: sourceDay.notes,
      },
    });

    if (!empty) {
      // Copy blocks, exercises, and sets
      for (const sourceBlock of sourceDay.blocks) {
        const newBlock = await prisma.workoutBlock.create({
          data: {
            workoutDayId: newDay.id,
            order: sourceBlock.order,
            label: sourceBlock.label,
            comment: sourceBlock.comment,
          },
        });

        for (const sourceExercise of sourceBlock.exercises) {
          const newExercise = await prisma.workoutBlockExercise.create({
            data: {
              workoutBlockId: newBlock.id,
              exerciseId: sourceExercise.exerciseId,
              order: sourceExercise.order,
              comment: sourceExercise.comment,
              variants: sourceExercise.variants,
            },
          });

          for (const sourceSet of sourceExercise.sets) {
            await prisma.set.create({
              data: {
                workoutBlockExerciseId: newExercise.id,
                setIndex: sourceSet.setIndex,
                reps: sourceSet.reps,
                weightKg: sourceSet.weightKg,
                durationSeconds: sourceSet.durationSeconds,
                repsPerSide: sourceSet.repsPerSide,
                // Reset actuals
                actualReps: null,
                actualWeightKg: null,
                actualDurationSeconds: null,
                actualRpe: null,
                completed: false,
                skipped: false,
                logNotes: null,
                completedAt: null,
              },
            });
          }
        }
      }
    }
  }

  revalidatePath(`/trainer/athletes/${athleteId}`);

  return { weekNumber: targetWeek };
}
