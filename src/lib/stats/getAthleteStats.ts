import { cache } from "react";
import prisma from "@/lib/prisma";

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
  const today = new Date();

  // Find the most recent weekStartDate that is <= today from the user's actual data
  const currentWeekDay = await prisma.workoutDay.findFirst({
    where: {
      athleteId,
      weekStartDate: { lte: today },
    },
    orderBy: { weekStartDate: "desc" },
    select: { weekStartDate: true },
  });

  const currentWeekStart = currentWeekDay?.weekStartDate ?? today;

  // Weekly completion - sets from current week
  const weeklyStats = await prisma.set.aggregate({
    where: {
      workoutBlockExercise: {
        workoutBlock: {
          workoutDay: {
            athleteId,
            weekStartDate: currentWeekStart,
          },
        },
      },
    },
    _count: { id: true },
  });

  const completedCount = await prisma.set.count({
    where: {
      workoutBlockExercise: {
        workoutBlock: {
          workoutDay: {
            athleteId,
            weekStartDate: currentWeekStart,
          },
        },
      },
      completed: true,
    },
  });

  const skippedCount = await prisma.set.count({
    where: {
      workoutBlockExercise: {
        workoutBlock: {
          workoutDay: {
            athleteId,
            weekStartDate: currentWeekStart,
          },
        },
      },
      skipped: true,
    },
  });

  // Adherence calculation
  const adherenceStartDate =
    adherenceRange === "week" ? currentWeekStart : getMonthAgo();

  const setsWithActuals = await prisma.set.findMany({
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
  });

  let avgWeightDiff: number | null = null;
  let avgRepsDiff: number | null = null;

  if (setsWithActuals.length > 0) {
    const totalWeightDiff = setsWithActuals.reduce((sum, s) => {
      const actual = s.actualWeightKg ?? 0;
      const prescribed = s.weightKg ?? 0;
      return sum + (actual - prescribed);
    }, 0);
    const totalRepsDiff = setsWithActuals.reduce((sum, s) => {
      const actual = s.actualReps ?? 0;
      const prescribed = s.reps ?? 0;
      return sum + (actual - prescribed);
    }, 0);
    avgWeightDiff = totalWeightDiff / setsWithActuals.length;
    avgRepsDiff = totalRepsDiff / setsWithActuals.length;
  }

  // Personal records - top 5 by max weight
  const allCompletedSets = await prisma.set.findMany({
    where: {
      workoutBlockExercise: {
        workoutBlock: {
          workoutDay: {
            athleteId,
          },
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
  });

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
