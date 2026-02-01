import { cache } from "react";
import prisma from "../prisma";

type SuggestedDay = {
  weekNumber: number;
  dayIndex: number;
} | null;

export const getSuggestedWorkoutDay = cache(
  async function getSuggestedWorkoutDay(
    athleteId: string
  ): Promise<SuggestedDay> {
    // 1. Get latest week by weekStartDate
    const latestDay = await prisma.workoutDay.findFirst({
      where: { athleteId },
      orderBy: { weekStartDate: "desc" },
      select: { weekNumber: true },
    });

    if (!latestDay) {
      return null;
    }

    // 2. For now, just return day 1 of latest week
    // (completion logic will be added in a future task)
    return {
      weekNumber: latestDay.weekNumber,
      dayIndex: 1,
    };
  }
);
