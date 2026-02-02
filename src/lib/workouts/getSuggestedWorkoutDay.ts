import { cache } from "react";
import prisma from "../prisma";

type SuggestedDay = {
  weekNumber: number;
  dayIndex: number;
} | null;

/**
 * Check if a day is done (all sets completed or skipped)
 */
function isDayDone(day: {
  blocks: {
    exercises: {
      sets: { completed: boolean; skipped: boolean }[];
    }[];
  }[];
}): boolean {
  const allSets = day.blocks.flatMap((b) => b.exercises.flatMap((e) => e.sets));
  if (allSets.length === 0) return false;
  return allSets.every((s) => s.completed || s.skipped);
}

/**
 * Check if a week is done (all days in the week are done)
 */
export function isWeekDone(
  days: { weekNumber: number; isDone: boolean }[],
  weekNumber: number
): boolean {
  const weekDays = days.filter((d) => d.weekNumber === weekNumber);
  if (weekDays.length === 0) return false;
  return weekDays.every((d) => d.isDone);
}

/**
 * Get the suggested workout day for an athlete.
 * Logic:
 * 1. Get all workout days with their completion status
 * 2. Group by week, ordered by weekStartDate desc (most recent first)
 * 3. Find the most recent week that has incomplete days
 * 4. Return the first incomplete day in that week
 * 5. If all weeks are complete, suggest day 1 of the most recent week
 */
export const getSuggestedWorkoutDay = cache(
  async function getSuggestedWorkoutDay(
    athleteId: string
  ): Promise<SuggestedDay> {
    // Fetch all workout days with completion data
    const workoutDays = await prisma.workoutDay.findMany({
      where: { athleteId },
      select: {
        weekNumber: true,
        weekStartDate: true,
        dayIndex: true,
        blocks: {
          select: {
            exercises: {
              select: {
                sets: {
                  select: {
                    completed: true,
                    skipped: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ weekStartDate: "desc" }, { dayIndex: "asc" }],
    });

    if (workoutDays.length === 0) {
      return null;
    }

    // Compute isDone for each day
    const daysWithStatus = workoutDays.map((day) => ({
      weekNumber: day.weekNumber,
      weekStartDate: day.weekStartDate,
      dayIndex: day.dayIndex,
      isDone: isDayDone(day),
    }));

    // Group by week (maintain order - most recent first)
    const weekNumbers = [...new Set(daysWithStatus.map((d) => d.weekNumber))];

    // Find the most recent week with incomplete days
    for (const weekNumber of weekNumbers) {
      const weekDays = daysWithStatus
        .filter((d) => d.weekNumber === weekNumber)
        .sort((a, b) => a.dayIndex - b.dayIndex);

      // Find first incomplete day in this week
      const firstIncomplete = weekDays.find((d) => !d.isDone);
      if (firstIncomplete) {
        return {
          weekNumber: firstIncomplete.weekNumber,
          dayIndex: firstIncomplete.dayIndex,
        };
      }
    }

    // All days are complete - suggest day 1 of most recent week
    const mostRecentWeek = weekNumbers[0];
    if (mostRecentWeek !== undefined) {
      return {
        weekNumber: mostRecentWeek,
        dayIndex: 1,
      };
    }

    return null;
  }
);
