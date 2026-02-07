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

export const getTrainerAthletes = cache(async function getTrainerAthletes(
  trainerId: string
): Promise<TrainerAthlete[]> {
  const currentWeekStart = getCurrentWeekStart();

  const relationships = await prisma.trainerAthlete.findMany({
    where: { trainerId },
    include: {
      athlete: {
        include: {
          athleteWorkoutDays: {
            where: {
              weekStartDate: currentWeekStart,
            },
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
    const allSets = rel.athlete.athleteWorkoutDays.flatMap((day) =>
      day.blocks.flatMap((block) => block.exercises.flatMap((ex) => ex.sets))
    );

    const completed = allSets.filter((s) => s.completed).length;
    const total = allSets.length;

    return {
      id: rel.athlete.id,
      name: rel.athlete.name ?? rel.athlete.email.split("@")[0] ?? "Unknown",
      email: rel.athlete.email,
      lastActivity: null,
      weeklyCompletion: { completed, total },
      needsAttention: false,
      attentionReason: null,
    };
  });
});
