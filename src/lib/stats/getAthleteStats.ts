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

function _getMonthAgo(): Date {
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

  return {
    weeklyCompletion: {
      completed: completedCount,
      skipped: skippedCount,
      total: weeklyStats._count.id,
    },
    adherence: {
      range: adherenceRange,
      avgWeightDiff: null,
      avgRepsDiff: null,
    },
    personalRecords: [],
  };
});
