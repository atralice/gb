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

export const getTrainerAthletes = cache(async function getTrainerAthletes(
  trainerId: string
): Promise<TrainerAthlete[]> {
  const relationships = await prisma.trainerAthlete.findMany({
    where: { trainerId },
    include: {
      athlete: true,
    },
  });

  return relationships.map((rel) => ({
    id: rel.athlete.id,
    name: rel.athlete.name ?? rel.athlete.email.split("@")[0] ?? "Unknown",
    email: rel.athlete.email,
    lastActivity: null,
    weeklyCompletion: { completed: 0, total: 0 },
    needsAttention: false,
    attentionReason: null,
  }));
});
