import { describe, test, expect, beforeEach } from "bun:test";
import { updateSets } from "../actions/updateSets";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("updateSets", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("updates reps and weightKg for multiple sets", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 5,
      dayIndex: 1,
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: workoutDay.id } },
      order: 1,
    });

    const workoutExercise = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    const set1 = await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 60,
    });

    const set2 = await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 2,
      reps: 5,
      weightKg: 60,
    });

    await updateSets([
      { setId: set1.id, reps: 6, weightKg: 65 },
      { setId: set2.id, reps: 4, weightKg: 70 },
    ]);

    const updated1 = await prisma.set.findUnique({ where: { id: set1.id } });
    const updated2 = await prisma.set.findUnique({ where: { id: set2.id } });

    expect(updated1?.reps).toBe(6);
    expect(updated1?.weightKg).toBe(65);
    expect(updated2?.reps).toBe(4);
    expect(updated2?.weightKg).toBe(70);
  });

  test("allows partial updates", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 5,
      dayIndex: 1,
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: workoutDay.id } },
      order: 1,
    });

    const workoutExercise = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    const set = await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 60,
    });

    // Only update weight
    await updateSets([{ setId: set.id, weightKg: 65 }]);

    const updated = await prisma.set.findUnique({ where: { id: set.id } });

    expect(updated?.reps).toBe(5); // unchanged
    expect(updated?.weightKg).toBe(65); // changed
  });
});
