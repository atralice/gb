import { cache } from "react";
import prisma from "../prisma";

export type TrainerAthlete = {
  id: string;
  name: string;
  email: string;
  lastActivity: Date | null;
  weeklyCompletion: { completed: number; total: number };
  needsAttention: boolean;
  attentionReason: "inactive" | "no_next_week" | null;
};

function getCurrentWeekStart(): Date {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getNextWeekStart(): Date {
  const current = getCurrentWeekStart();
  current.setDate(current.getDate() + 7);
  return current;
}

const INACTIVE_DAYS_THRESHOLD = 4;

export const getTrainerAthletes = cache(async function getTrainerAthletes(
  trainerId: string
): Promise<TrainerAthlete[]> {
  const currentWeekStart = getCurrentWeekStart();
  const nextWeekStart = getNextWeekStart();

  const relationships = await prisma.trainerAthlete.findMany({
    where: { trainerId },
    include: {
      athlete: {
        include: {
          athleteWorkoutDays: {
            include: {
              blocks: {
                include: {
                  exercises: {
                    include: {
                      sets: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return relationships.map((rel) => {
    const allDays = rel.athlete.athleteWorkoutDays;
    const currentWeekDays = allDays.filter(
      (d) => d.weekStartDate.getTime() === currentWeekStart.getTime()
    );
    const nextWeekDays = allDays.filter(
      (d) => d.weekStartDate.getTime() === nextWeekStart.getTime()
    );

    // Current week sets
    const currentWeekSets = currentWeekDays.flatMap((day) =>
      day.blocks.flatMap((block) => block.exercises.flatMap((ex) => ex.sets))
    );
    const completed = currentWeekSets.filter((s) => s.completed).length;
    const total = currentWeekSets.length;

    // All sets for last activity
    const allSets = allDays.flatMap((day) =>
      day.blocks.flatMap((block) => block.exercises.flatMap((ex) => ex.sets))
    );

    // Find most recent completedAt
    const completedDates = allSets
      .map((s) => s.completedAt)
      .filter((d): d is Date => d !== null);
    const lastActivity =
      completedDates.length > 0
        ? completedDates.reduce((latest, d) => (d > latest ? d : latest))
        : null;

    // Check needs attention
    let needsAttention = false;
    let attentionReason: "inactive" | "no_next_week" | null = null;

    // Inactive check
    if (lastActivity) {
      const daysSinceActivity = Math.floor(
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceActivity >= INACTIVE_DAYS_THRESHOLD) {
        needsAttention = true;
        attentionReason = "inactive";
      }
    }

    // No next week check (only if current week is complete and not already flagged)
    if (!needsAttention && total > 0 && completed === total) {
      if (nextWeekDays.length === 0) {
        needsAttention = true;
        attentionReason = "no_next_week";
      }
    }

    return {
      id: rel.athlete.id,
      name: rel.athlete.name ?? rel.athlete.email.split("@")[0] ?? "Unknown",
      email: rel.athlete.email,
      lastActivity,
      weeklyCompletion: { completed, total },
      needsAttention,
      attentionReason,
    };
  });
});
