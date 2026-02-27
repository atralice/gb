import { cache } from "react";
import prisma from "@/lib/prisma";
import { findCurrentWeekStart } from "@/lib/workouts/findCurrentWeek";

export type AthleteStats = {
  weeklyCompletion: {
    completed: number;
    skipped: number;
    total: number;
    weekStart: Date;
    weekEnd: Date;
  };
  adherence: {
    range: "week" | "month";
    avgWeightDiff: number | null;
    avgRepsDiff: number | null;
  };
  personalRecords: Array<{
    exerciseName: string;
    weightKg: number;
    achievedAt: Date;
  }>;
};

function getMonthAgo(): Date {
  const today = new Date();
  return new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth() - 1,
      today.getUTCDate()
    )
  );
}

export const getAthleteStats = cache(async function getAthleteStats(
  athleteId: string,
  adherenceRange: "week" | "month"
): Promise<AthleteStats> {
  // Fetch distinct week start dates sorted ascending
  const allWeeks = await prisma.workoutDay.findMany({
    where: { athleteId },
    select: { weekStartDate: true },
    distinct: ["weekStartDate"],
    orderBy: { weekStartDate: "asc" },
  });

  const currentWeekStart =
    findCurrentWeekStart(allWeeks) ??
    allWeeks.at(-1)?.weekStartDate ??
    new Date();

  // Adherence calculation
  const adherenceStartDate =
    adherenceRange === "week" ? currentWeekStart : getMonthAgo();

  const currentWeekFilter = {
    workoutBlockExercise: {
      workoutBlock: {
        workoutDay: {
          athleteId,
          weekStartDate: currentWeekStart,
        },
      },
    },
  } as const;

  // Run all independent queries in parallel
  const [
    weeklyStats,
    completedCount,
    skippedCount,
    setsWithActuals,
    allCompletedSets,
  ] = await Promise.all([
    prisma.set.aggregate({
      where: currentWeekFilter,
      _count: { id: true },
    }),
    prisma.set.count({
      where: { ...currentWeekFilter, completed: true },
    }),
    prisma.set.count({
      where: { ...currentWeekFilter, skipped: true },
    }),
    prisma.set.findMany({
      where: {
        workoutBlockExercise: {
          workoutBlock: {
            workoutDay: {
              athleteId,
              weekStartDate: { gte: adherenceStartDate },
            },
          },
        },
        completed: true,
        skipped: false,
        actualWeightKg: { not: null },
        actualReps: { not: null },
        weightKg: { not: null },
        reps: { not: null },
      },
      select: {
        weightKg: true,
        reps: true,
        actualWeightKg: true,
        actualReps: true,
      },
    }),
    prisma.set.findMany({
      where: {
        workoutBlockExercise: {
          workoutBlock: {
            workoutDay: { athleteId },
          },
        },
        completed: true,
        skipped: false,
        actualWeightKg: { not: null },
      },
      select: {
        actualWeightKg: true,
        completedAt: true,
        workoutBlockExercise: {
          select: {
            exercise: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  let avgWeightDiff: number | null = null;
  let avgRepsDiff: number | null = null;

  if (setsWithActuals.length > 0) {
    let totalWeightDiff = 0;
    let totalRepsDiff = 0;
    for (const s of setsWithActuals) {
      totalWeightDiff += (s.actualWeightKg ?? 0) - (s.weightKg ?? 0);
      totalRepsDiff += (s.actualReps ?? 0) - (s.reps ?? 0);
    }
    avgWeightDiff = totalWeightDiff / setsWithActuals.length;
    avgRepsDiff = totalRepsDiff / setsWithActuals.length;
  }

  // Group by exercise and find max
  const prMap = new Map<
    string,
    { exerciseName: string; weightKg: number; achievedAt: Date }
  >();

  for (const set of allCompletedSets) {
    const exerciseId = set.workoutBlockExercise.exercise.id;
    const exerciseName = set.workoutBlockExercise.exercise.name;
    const weightKg = set.actualWeightKg ?? 0;
    const achievedAt = set.completedAt ?? new Date();

    const existing = prMap.get(exerciseId);
    if (!existing || weightKg > existing.weightKg) {
      prMap.set(exerciseId, { exerciseName, weightKg, achievedAt });
    }
  }

  const personalRecords = Array.from(prMap.values())
    .sort((a, b) => b.weightKg - a.weightKg)
    .slice(0, 5);

  // Calculate week end (Sunday)
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  return {
    weeklyCompletion: {
      completed: completedCount,
      skipped: skippedCount,
      total: weeklyStats._count.id,
      weekStart: currentWeekStart,
      weekEnd,
    },
    adherence: {
      range: adherenceRange,
      avgWeightDiff,
      avgRepsDiff,
    },
    personalRecords,
  };
});
