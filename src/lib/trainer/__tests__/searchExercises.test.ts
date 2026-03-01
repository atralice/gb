import { describe, test, expect, beforeEach } from "bun:test";
import { searchExercises } from "../searchExercises";
import { createExercise } from "../actions/createExercise";
import prisma from "@/lib/prisma";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import userFactory from "test/helpers/factories/userFactory";
import truncateDb from "test/helpers/test-helpers";

describe("searchExercises", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns exercises matching query (case-insensitive)", async () => {
    await exerciseFactory.create({ name: "Squat" });
    await exerciseFactory.create({ name: "Bench Press" });
    await exerciseFactory.create({ name: "Deadlift" });

    const results = await searchExercises("squat");

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Squat");
  });

  test("returns empty array when no match", async () => {
    await exerciseFactory.create({ name: "Squat" });
    await exerciseFactory.create({ name: "Bench Press" });

    const results = await searchExercises("curls");

    expect(results).toHaveLength(0);
  });

  test("returns all exercises when query is empty", async () => {
    await exerciseFactory.create({ name: "Squat" });
    await exerciseFactory.create({ name: "Bench Press" });
    await exerciseFactory.create({ name: "Deadlift" });

    const results = await searchExercises("");

    expect(results).toHaveLength(3);
  });

  test("limits results to 20", async () => {
    const exercises = Array.from({ length: 25 }, (_, i) => ({
      name: `Exercise ${String(i + 1).padStart(2, "0")}`,
    }));

    for (const ex of exercises) {
      await exerciseFactory.create(ex);
    }

    const results = await searchExercises("");

    expect(results).toHaveLength(20);
  });

  test("returns trainer's own exercises first, then global matches", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({
      name: "Squat",
      owner: { connect: { id: trainer.id } },
    });
    await exerciseFactory.create({ name: "Squat" }); // global

    const results = await searchExercises("squat", trainer.id);

    expect(results).toHaveLength(2);
    expect(results[0]?.name).toBe("Squat");
    expect(results[0]?.isGlobal).toBe(false);
    expect(results[1]?.name).toBe("Squat");
    expect(results[1]?.isGlobal).toBe(true);
  });

  test("without trainerId returns only global exercises", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({
      name: "Squat",
      owner: { connect: { id: trainer.id } },
    });
    await exerciseFactory.create({ name: "Squat" }); // global

    const results = await searchExercises("squat");

    expect(results).toHaveLength(1);
    expect(results[0]?.isGlobal).toBe(true);
  });

  test("does not return other trainers' exercises", async () => {
    const trainerA = await userFactory.create({ role: "trainer" });
    const trainerB = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({
      name: "Squat",
      owner: { connect: { id: trainerA.id } },
    });
    await exerciseFactory.create({
      name: "Bench",
      owner: { connect: { id: trainerB.id } },
    });

    const results = await searchExercises("", trainerA.id);

    const names = results.map((r) => r.name);
    expect(names).not.toContain("Bench");
  });
});

describe("createExercise", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("creates exercise and returns id", async () => {
    const result = await createExercise("Nuevo ejercicio");
    expect(result.id).toBeDefined();

    const found = await prisma.exercise.findUnique({
      where: { id: result.id },
    });
    expect(found?.name).toBe("Nuevo ejercicio");
  });

  test("creates exercise with ownerId", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const result = await createExercise("My Exercise", "weighted", trainer.id);

    const found = await prisma.exercise.findUnique({
      where: { id: result.id },
    });
    expect(found?.ownerId).toBe(trainer.id);
  });

  test("creates global exercise when no ownerId", async () => {
    const result = await createExercise("Global Exercise", "weighted");

    const found = await prisma.exercise.findUnique({
      where: { id: result.id },
    });
    expect(found?.ownerId).toBeNull();
  });
});
