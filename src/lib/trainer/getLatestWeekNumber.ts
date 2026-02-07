import { cache } from "react";
import prisma from "../prisma";

export const getLatestWeekNumber = cache(async function getLatestWeekNumber(
  athleteId: string
): Promise<number | null> {
  const latest = await prisma.workoutDay.findFirst({
    where: { athleteId },
    orderBy: { weekNumber: "desc" },
    select: { weekNumber: true },
  });

  return latest?.weekNumber ?? null;
});
