import { describe, test, expect, beforeEach } from "bun:test";
import { addExerciseToBlock } from "../actions/addExerciseToBlock";
import { removeExerciseFromBlock } from "../actions/removeExerciseFromBlock";
import { replaceExercise } from "../actions/replaceExercise";
import { reorderExercise } from "../actions/reorderExercise";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("addExerciseToBlock", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("adds exercise with empty sets matching block series count", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise1 = await exerciseFactory.create({ name: "Squat" });
    const exercise2 = await exerciseFactory.create({ name: "Bench Press" });

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

    const existingExercise = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise1.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    // Create 3 sets for the existing exercise
    await setFactory.create({
      workoutBlockExercise: { connect: { id: existingExercise.id } },
      setIndex: 1,
      reps: 8,
      weightKg: 60,
    });
    await setFactory.create({
      workoutBlockExercise: { connect: { id: existingExercise.id } },
      setIndex: 2,
      reps: 8,
      weightKg: 60,
    });
    await setFactory.create({
      workoutBlockExercise: { connect: { id: existingExercise.id } },
      setIndex: 3,
      reps: 8,
      weightKg: 60,
    });

    await addExerciseToBlock(block.id, exercise2.id);

    const exercises = await prisma.workoutBlockExercise.findMany({
      where: { workoutBlockId: block.id },
      include: { sets: { orderBy: { setIndex: "asc" } } },
      orderBy: { order: "asc" },
    });

    expect(exercises).toHaveLength(2);

    const newExercise = exercises[1];
    expect(newExercise?.exerciseId).toBe(exercise2.id);
    expect(newExercise?.order).toBe(2);
    expect(newExercise?.sets).toHaveLength(3);

    for (const set of newExercise?.sets ?? []) {
      expect(set.reps).toBeNull();
      expect(set.weightKg).toBeNull();
      expect(set.repsPerSide).toBe(false);
    }
  });

  test("adds exercise to empty block with 1 set", async () => {
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

    await addExerciseToBlock(block.id, exercise.id);

    const exercises = await prisma.workoutBlockExercise.findMany({
      where: { workoutBlockId: block.id },
      include: { sets: { orderBy: { setIndex: "asc" } } },
    });

    expect(exercises).toHaveLength(1);
    expect(exercises[0]?.order).toBe(1);
    expect(exercises[0]?.sets).toHaveLength(1);
    expect(exercises[0]?.sets[0]?.reps).toBeNull();
    expect(exercises[0]?.sets[0]?.weightKg).toBeNull();
    expect(exercises[0]?.sets[0]?.repsPerSide).toBe(false);
  });
});

describe("removeExerciseFromBlock", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("removes exercise and its sets (cascade delete)", async () => {
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

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 8,
      weightKg: 60,
    });
    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 2,
      reps: 8,
      weightKg: 60,
    });

    await removeExerciseFromBlock(workoutExercise.id);

    const exercises = await prisma.workoutBlockExercise.findMany({
      where: { workoutBlockId: block.id },
    });
    expect(exercises).toHaveLength(0);

    const sets = await prisma.set.findMany({
      where: { workoutBlockExerciseId: workoutExercise.id },
    });
    expect(sets).toHaveLength(0);
  });
});

describe("replaceExercise", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("swaps exerciseId keeping sets intact", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise1 = await exerciseFactory.create({ name: "Squat" });
    const exercise2 = await exerciseFactory.create({ name: "Deadlift" });

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
      exercise: { connect: { id: exercise1.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    const set1 = await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 100,
    });
    const set2 = await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 2,
      reps: 5,
      weightKg: 100,
    });

    await replaceExercise(workoutExercise.id, exercise2.id);

    const updated = await prisma.workoutBlockExercise.findUnique({
      where: { id: workoutExercise.id },
      include: { sets: { orderBy: { setIndex: "asc" } } },
    });

    expect(updated?.exerciseId).toBe(exercise2.id);
    expect(updated?.sets).toHaveLength(2);
    expect(updated?.sets[0]?.id).toBe(set1.id);
    expect(updated?.sets[0]?.reps).toBe(5);
    expect(updated?.sets[0]?.weightKg).toBe(100);
    expect(updated?.sets[1]?.id).toBe(set2.id);
  });
});

describe("reorderExercise", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("swaps order between two exercises", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise1 = await exerciseFactory.create({ name: "Squat" });
    const exercise2 = await exerciseFactory.create({ name: "Bench Press" });

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

    const wbe1 = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise1.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    const wbe2 = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise2.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 2,
    });

    await reorderExercise(wbe1.id, wbe2.id);

    const updated1 = await prisma.workoutBlockExercise.findUnique({
      where: { id: wbe1.id },
    });
    const updated2 = await prisma.workoutBlockExercise.findUnique({
      where: { id: wbe2.id },
    });

    expect(updated1?.order).toBe(2);
    expect(updated2?.order).toBe(1);
  });
});
