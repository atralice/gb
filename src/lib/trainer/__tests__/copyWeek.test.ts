import { describe, test, expect, beforeEach } from "bun:test";
import { copyWeek } from "../actions/copyWeek";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("copyWeek", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("copies week structure with all exercises and sets", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create({ name: "Peso muerto" });

    const sourceWeekStart = new Date("2026-02-02");

    const day1 = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: sourceWeekStart,
      weekNumber: 5,
      dayIndex: 1,
      label: "Día 1",
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day1.id } },
      order: 1,
      label: "A",
    });

    const workoutExercise = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 100,
      actualReps: 5,
      actualWeightKg: 102,
      completed: true,
    });

    const result = await copyWeek(athlete.id, trainer.id, 5, 6, false);

    expect(result.weekNumber).toBe(6);

    // Verify new week exists
    const newDays = await prisma.workoutDay.findMany({
      where: { athleteId: athlete.id, weekNumber: 6 },
      include: {
        blocks: {
          include: {
            exercises: {
              include: { sets: true },
            },
          },
        },
      },
    });

    expect(newDays).toHaveLength(1);
    expect(newDays[0]?.dayIndex).toBe(1);
    expect(newDays[0]?.blocks).toHaveLength(1);
    expect(newDays[0]?.blocks[0]?.exercises).toHaveLength(1);
    expect(newDays[0]?.blocks[0]?.exercises[0]?.sets).toHaveLength(1);

    // Verify prescribed values copied, actuals reset
    const newSet = newDays[0]?.blocks[0]?.exercises[0]?.sets[0];
    expect(newSet?.reps).toBe(5);
    expect(newSet?.weightKg).toBe(100);
    expect(newSet?.actualReps).toBeNull();
    expect(newSet?.actualWeightKg).toBeNull();
    expect(newSet?.completed).toBe(false);
  });

  test("creates empty week when empty=true", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    const day1 = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 5,
      dayIndex: 1,
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day1.id } },
      order: 1,
    });

    await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    const result = await copyWeek(athlete.id, trainer.id, 5, 6, true);

    expect(result.weekNumber).toBe(6);

    const newDays = await prisma.workoutDay.findMany({
      where: { athleteId: athlete.id, weekNumber: 6 },
      include: { blocks: true },
    });

    // Days created but no blocks
    expect(newDays).toHaveLength(1);
    expect(newDays[0]?.blocks).toHaveLength(0);
  });
});
