import { describe, test, expect, beforeEach } from "bun:test";
import { getWorkoutDay } from "../getWorkoutDay";
import { BlockType } from "@/types/workout";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import workoutDayExerciseFactory from "test/helpers/factories/workoutDayExerciseFactory";
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
  test("returns workout day with exercises and sets", async () => {
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

    const workoutExercise1 = await workoutDayExerciseFactory.create({
      exercise: { connect: { id: exercise1.id } },
      workoutDay: { connect: { id: workoutDay.id } },
      block: BlockType.a,
      order: 1,
    });

    const workoutExercise2 = await workoutDayExerciseFactory.create({
      exercise: { connect: { id: exercise2.id } },
      workoutDay: { connect: { id: workoutDay.id } },
      block: BlockType.b,
      order: 1,
    });

    await setFactory.create({
      workoutDayExercise: { connect: { id: workoutExercise1.id } },
      setIndex: 1,
      reps: 8,
      weightKg: 60,
    });

    await setFactory.create({
      workoutDayExercise: { connect: { id: workoutExercise1.id } },
      setIndex: 2,
      reps: 8,
      weightKg: 65,
    });

    await setFactory.create({
      workoutDayExercise: { connect: { id: workoutExercise2.id } },
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
    expect(result.exercises).toHaveLength(2);

    const exercise1Result = result.exercises.find(
      (ex) => ex.exercise.id === exercise1.id
    );
    expectDefined(exercise1Result);
    expect(exercise1Result).toMatchObject({
      block: BlockType.a,
    });
    expect(exercise1Result.exercise).toMatchObject({
      name: "Exercise 1",
    });
    expect(exercise1Result.sets).toHaveLength(2);
    expect(exercise1Result.sets[0]).toMatchObject({
      reps: 8,
      weightKg: 60,
    });
    expect(exercise1Result.sets[1]).toMatchObject({
      reps: 8,
      weightKg: 65,
    });

    const exercise2Result = result.exercises.find(
      (ex) => ex.exercise.id === exercise2.id
    );
    expectDefined(exercise2Result);
    expect(exercise2Result).toMatchObject({
      block: BlockType.b,
    });
    expect(exercise2Result.exercise).toMatchObject({
      name: "Exercise 2",
    });
    expect(exercise2Result.sets).toHaveLength(1);
    expect(exercise2Result.sets[0]).toMatchObject({
      reps: 10,
      weightKg: null,
    });
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

  test("orders exercises by block and order", async () => {
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

    // Create exercises in non-sequential order
    await workoutDayExerciseFactory.create({
      exercise: { connect: { id: exercise3.id } },
      workoutDay: { connect: { id: workoutDay.id } },
      block: BlockType.c,
      order: 1,
    });

    await workoutDayExerciseFactory.create({
      exercise: { connect: { id: exercise1.id } },
      workoutDay: { connect: { id: workoutDay.id } },
      block: BlockType.a,
      order: 1,
    });

    await workoutDayExerciseFactory.create({
      exercise: { connect: { id: exercise2.id } },
      workoutDay: { connect: { id: workoutDay.id } },
      block: BlockType.a,
      order: 2,
    });

    const result = await getWorkoutDay(1, 10);

    expectDefinedNotNull(result);
    expect(result.exercises).toHaveLength(3);
    expect(result.exercises[0]).toMatchObject({
      block: BlockType.a,
      order: 1,
    });
    expect(result.exercises[1]).toMatchObject({
      block: BlockType.a,
      order: 2,
    });
    expect(result.exercises[2]).toMatchObject({
      block: BlockType.c,
      order: 1,
    });
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

    const workoutExercise = await workoutDayExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutDay: { connect: { id: workoutDay.id } },
      block: BlockType.a,
      order: 1,
    });

    // Create sets in non-sequential order
    await setFactory.create({
      workoutDayExercise: { connect: { id: workoutExercise.id } },
      setIndex: 3,
      reps: 8,
      weightKg: 70,
    });

    await setFactory.create({
      workoutDayExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 8,
      weightKg: 60,
    });

    await setFactory.create({
      workoutDayExercise: { connect: { id: workoutExercise.id } },
      setIndex: 2,
      reps: 8,
      weightKg: 65,
    });

    const result = await getWorkoutDay(1, 10);

    expectDefinedNotNull(result);
    const sets = result.exercises[0]?.sets;
    expectDefined(sets);
    expect(sets).toHaveLength(3);
    expect(sets[0]).toMatchObject({
      setIndex: 1,
      weightKg: 60,
    });
    expect(sets[1]).toMatchObject({
      setIndex: 2,
      weightKg: 65,
    });
    expect(sets[2]).toMatchObject({
      setIndex: 3,
      weightKg: 70,
    });
  });
});
