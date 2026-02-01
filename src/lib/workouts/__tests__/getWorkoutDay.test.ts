import { describe, test, expect, beforeEach } from "bun:test";
import { getWorkoutDay } from "../getWorkoutDay";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import { UserRole } from "@prisma/client";
import {
  expectDefined,
  expectDefinedNotNull,
} from "test/helpers/expectDefined";
import truncateDb from "test/helpers/test-helpers";

describe("getWorkoutDay", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns workout day with blocks, exercises, and sets", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });

    const exercise1 = await exerciseFactory.create({ name: "Exercise 1" });
    const exercise2 = await exerciseFactory.create({ name: "Exercise 2" });

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 10,
      dayIndex: 1,
      label: "Día 1",
      notes: "Warmup notes",
    });

    const blockA = await workoutBlockFactory.create({
      workoutDay: { connect: { id: workoutDay.id } },
      order: 1,
      label: "Bloque A",
    });

    const blockB = await workoutBlockFactory.create({
      workoutDay: { connect: { id: workoutDay.id } },
      order: 2,
      label: "Bloque B",
    });

    const workoutExercise1 = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise1.id } },
      workoutBlock: { connect: { id: blockA.id } },
      order: 1,
    });

    const workoutExercise2 = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise2.id } },
      workoutBlock: { connect: { id: blockB.id } },
      order: 1,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise1.id } },
      setIndex: 1,
      reps: 8,
      weightKg: 60,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise1.id } },
      setIndex: 2,
      reps: 8,
      weightKg: 65,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise2.id } },
      setIndex: 1,
      reps: 10,
      weightKg: null,
    });

    const result = await getWorkoutDay(1, 10);

    expectDefinedNotNull(result);
    expect(result).toMatchObject({
      id: workoutDay.id,
      weekNumber: 10,
      dayIndex: 1,
      label: "Día 1",
      notes: "Warmup notes",
    });
    expect(result.blocks).toHaveLength(2);

    const blockAResult = result.blocks.find((b) => b.id === blockA.id);
    expectDefined(blockAResult);
    expect(blockAResult.exercises).toHaveLength(1);

    const exercise1Result = blockAResult.exercises[0];
    expectDefined(exercise1Result);
    expect(exercise1Result.exercise).toMatchObject({ name: "Exercise 1" });
    expect(exercise1Result.sets).toHaveLength(2);
    expect(exercise1Result.sets[0]).toMatchObject({ reps: 8, weightKg: 60 });
    expect(exercise1Result.sets[1]).toMatchObject({ reps: 8, weightKg: 65 });

    const blockBResult = result.blocks.find((b) => b.id === blockB.id);
    expectDefined(blockBResult);
    expect(blockBResult.exercises).toHaveLength(1);

    const exercise2Result = blockBResult.exercises[0];
    expectDefined(exercise2Result);
    expect(exercise2Result.exercise).toMatchObject({ name: "Exercise 2" });
    expect(exercise2Result.sets).toHaveLength(1);
    expect(exercise2Result.sets[0]).toMatchObject({ reps: 10, weightKg: null });
  });

  test("returns null when workout day not found", async () => {
    const result = await getWorkoutDay(999, 999);
    expect(result).toBeNull();
  });

  test("uses default parameters", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 10,
      dayIndex: 1,
    });

    const result = await getWorkoutDay();

    expectDefinedNotNull(result);
    expect(result).toMatchObject({
      weekNumber: 10,
      dayIndex: 1,
    });
  });

  test("orders blocks by order field", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 10,
      dayIndex: 1,
    });

    // Create blocks in non-sequential order
    await workoutBlockFactory.create({
      workoutDay: { connect: { id: workoutDay.id } },
      order: 3,
      label: "C",
    });

    await workoutBlockFactory.create({
      workoutDay: { connect: { id: workoutDay.id } },
      order: 1,
      label: "A",
    });

    await workoutBlockFactory.create({
      workoutDay: { connect: { id: workoutDay.id } },
      order: 2,
      label: "B",
    });

    const result = await getWorkoutDay(1, 10);

    expectDefinedNotNull(result);
    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0]).toMatchObject({ order: 1, label: "A" });
    expect(result.blocks[1]).toMatchObject({ order: 2, label: "B" });
    expect(result.blocks[2]).toMatchObject({ order: 3, label: "C" });
  });

  test("orders exercises within block by order field", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });

    const exercise1 = await exerciseFactory.create({ name: "Exercise 1" });
    const exercise2 = await exerciseFactory.create({ name: "Exercise 2" });
    const exercise3 = await exerciseFactory.create({ name: "Exercise 3" });

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 10,
      dayIndex: 1,
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: workoutDay.id } },
      order: 1,
    });

    // Create exercises in non-sequential order
    await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise3.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 3,
    });

    await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise1.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise2.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 2,
    });

    const result = await getWorkoutDay(1, 10);

    expectDefinedNotNull(result);
    const exercises = result.blocks[0]?.exercises;
    expectDefined(exercises);
    expect(exercises).toHaveLength(3);
    expect(exercises[0]?.exercise.name).toBe("Exercise 1");
    expect(exercises[1]?.exercise.name).toBe("Exercise 2");
    expect(exercises[2]?.exercise.name).toBe("Exercise 3");
  });

  test("orders sets by setIndex", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });

    const exercise = await exerciseFactory.create({ name: "Exercise" });

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 10,
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

    // Create sets in non-sequential order
    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 3,
      reps: 8,
      weightKg: 70,
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
      weightKg: 65,
    });

    const result = await getWorkoutDay(1, 10);

    expectDefinedNotNull(result);
    const sets = result.blocks[0]?.exercises[0]?.sets;
    expectDefined(sets);
    expect(sets).toHaveLength(3);
    expect(sets[0]).toMatchObject({ setIndex: 1, weightKg: 60 });
    expect(sets[1]).toMatchObject({ setIndex: 2, weightKg: 65 });
    expect(sets[2]).toMatchObject({ setIndex: 3, weightKg: 70 });
  });
});
