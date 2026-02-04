import { cache } from "react";
import prisma from "@/lib/prisma";

export type AthleteStats = {
  weeklyCompletion: {
    completed: number;
    skipped: number;
    total: number;
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

function getCurrentWeekStart(): Date {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getMonthAgo(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export const getAthleteStats = cache(async function getAthleteStats(
  athleteId: string,
  adherenceRange: "week" | "month"
): Promise<AthleteStats> {
  const currentWeekStart = getCurrentWeekStart();

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

  return {
    weeklyCompletion: {
      completed: completedCount,
      skipped: skippedCount,
      total: weeklyStats._count.id,
    },
    adherence: {
      range: adherenceRange,
      avgWeightDiff,
      avgRepsDiff,
    },
    personalRecords: [],
  };
});
