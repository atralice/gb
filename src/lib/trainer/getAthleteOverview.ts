import { cache } from "react";
import prisma from "../prisma";

export type OverviewSet = {
  setIndex: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
};

export type OverviewExercise = {
  exerciseId: string;
  exerciseName: string;
  blockLabel: string; // "A", "B", "C"
  blockComment: string | null;
  exerciseOrder: number; // 1, 2 within block
  exerciseComment: string | null;
  sets: OverviewSet[];
};

export type OverviewWeek = {
  weekNumber: number;
  weekStartDate: Date;
  exercises: OverviewExercise[];
};

export type OverviewDay = {
  dayIndex: number;
  label: string | null;
  notes: string | null; // warmup note
  weeks: OverviewWeek[];
};

export type AthleteOverviewData = {
  athlete: { id: string; name: string };
  latestWeekNumber: number;
  days: OverviewDay[];
};

export const getAthleteOverview = cache(async function getAthleteOverview(
  athleteId: string
): Promise<AthleteOverviewData | null> {
  const athlete = await prisma.user.findUnique({
    where: { id: athleteId },
    select: { id: true, name: true, email: true },
  });

  if (!athlete) return null;

  const workoutDays = await prisma.workoutDay.findMany({
    where: { athleteId },
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
    orderBy: [{ dayIndex: "asc" }, { weekNumber: "asc" }],
  });

  if (workoutDays.length === 0) return null;

  // Group by dayIndex
  const dayMap = new Map<
    number,
    {
      label: string | null;
      notes: string | null;
      weeks: Map<number, OverviewWeek>;
    }
  >();

  for (const day of workoutDays) {
    let dayEntry = dayMap.get(day.dayIndex);
    if (!dayEntry) {
      dayEntry = {
        label: day.label,
        notes: day.notes,
        weeks: new Map(),
      };
      dayMap.set(day.dayIndex, dayEntry);
    }

    const exercises: OverviewExercise[] = day.blocks.flatMap((block) =>
      block.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exercise.name,
        blockLabel: block.label ?? "",
        blockComment: block.comment,
        exerciseOrder: ex.order,
        exerciseComment: ex.comment,
        sets: ex.sets.map((set) => ({
          setIndex: set.setIndex,
          reps: set.reps,
          weightKg: set.weightKg,
          durationSeconds: set.durationSeconds,
          repsPerSide: set.repsPerSide,
        })),
      }))
    );

    dayEntry.weeks.set(day.weekNumber, {
      weekNumber: day.weekNumber,
      weekStartDate: day.weekStartDate,
      exercises,
    });
  }

  // Calculate latestWeekNumber
  const latestWeekNumber = Math.max(...workoutDays.map((d) => d.weekNumber));

  // Build sorted days array
  const dayIndices = [...dayMap.keys()].sort((a, b) => a - b);
  const days: OverviewDay[] = dayIndices.reduce<OverviewDay[]>(
    (acc, dayIndex) => {
      const entry = dayMap.get(dayIndex);
      if (!entry) return acc;
      const weeks = [...entry.weeks.values()].sort(
        (a, b) => a.weekNumber - b.weekNumber
      );
      acc.push({
        dayIndex,
        label: entry.label,
        notes: entry.notes,
        weeks,
      });
      return acc;
    },
    []
  );

  return {
    athlete: {
      id: athlete.id,
      name: athlete.name ?? athlete.email.split("@")[0] ?? "Unknown",
    },
    latestWeekNumber,
    days,
  };
});
