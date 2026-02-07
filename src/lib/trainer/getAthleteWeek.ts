import { cache } from "react";
import prisma from "../prisma";

export type AthleteWeekSet = {
  id: string;
  setIndex: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
  actualReps: number | null;
  actualWeightKg: number | null;
  completed: boolean;
  skipped: boolean;
  lastWeekActual: { reps: number; weightKg: number } | null;
};

export type AthleteWeekExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: AthleteWeekSet[];
};

export type AthleteWeekDay = {
  id: string;
  dayIndex: number;
  label: string | null;
  exercises: AthleteWeekExercise[];
};

export type AthleteWeekData = {
  athlete: { id: string; name: string };
  weekNumber: number;
  weekStartDate: Date;
  previousWeekExists: boolean;
  nextWeekExists: boolean;
  days: AthleteWeekDay[];
};

export const getAthleteWeek = cache(async function getAthleteWeek(
  athleteId: string,
  weekNumber: number
): Promise<AthleteWeekData | null> {
  const athlete = await prisma.user.findUnique({
    where: { id: athleteId },
    select: { id: true, name: true, email: true },
  });

  if (!athlete) return null;

  const workoutDays = await prisma.workoutDay.findMany({
    where: { athleteId, weekNumber },
    include: {
      blocks: {
        include: {
          exercises: {
            include: {
              exercise: true,
              sets: {
                orderBy: { setIndex: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { dayIndex: "asc" },
  });

  if (workoutDays.length === 0) return null;

  // Check previous/next week existence
  const [prevWeek, nextWeek] = await Promise.all([
    prisma.workoutDay.findFirst({
      where: { athleteId, weekNumber: weekNumber - 1 },
      select: { id: true },
    }),
    prisma.workoutDay.findFirst({
      where: { athleteId, weekNumber: weekNumber + 1 },
      select: { id: true },
    }),
  ]);

  // Get last week's data for comparison
  const lastWeekDays = await prisma.workoutDay.findMany({
    where: { athleteId, weekNumber: weekNumber - 1 },
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
  });

  // Build map of exercise -> last week actuals
  const lastWeekActuals = new Map<string, { reps: number; weightKg: number }>();
  for (const day of lastWeekDays) {
    for (const block of day.blocks) {
      for (const ex of block.exercises) {
        for (const set of ex.sets) {
          if (set.actualReps !== null && set.actualWeightKg !== null) {
            const existing = lastWeekActuals.get(ex.exerciseId);
            if (!existing || set.actualWeightKg > existing.weightKg) {
              lastWeekActuals.set(ex.exerciseId, {
                reps: set.actualReps,
                weightKg: set.actualWeightKg,
              });
            }
          }
        }
      }
    }
  }

  const days: AthleteWeekDay[] = workoutDays.map((day) => ({
    id: day.id,
    dayIndex: day.dayIndex,
    label: day.label,
    exercises: day.blocks.flatMap((block) =>
      block.exercises.map((ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exercise.name,
        sets: ex.sets.map((set) => ({
          id: set.id,
          setIndex: set.setIndex,
          reps: set.reps,
          weightKg: set.weightKg,
          durationSeconds: set.durationSeconds,
          repsPerSide: set.repsPerSide,
          actualReps: set.actualReps,
          actualWeightKg: set.actualWeightKg,
          completed: set.completed,
          skipped: set.skipped,
          lastWeekActual: lastWeekActuals.get(ex.exerciseId) ?? null,
        })),
      }))
    ),
  }));

  return {
    athlete: {
      id: athlete.id,
      name: athlete.name ?? athlete.email.split("@")[0] ?? "Unknown",
    },
    weekNumber,
    weekStartDate: workoutDays[0]?.weekStartDate ?? new Date(),
    previousWeekExists: prevWeek !== null,
    nextWeekExists: nextWeek !== null,
    days,
  };
});
