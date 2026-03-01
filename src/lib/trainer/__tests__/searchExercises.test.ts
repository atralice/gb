import { describe, test, expect, beforeEach } from "bun:test";
import { searchExercises } from "../searchExercises";
import { createExercise } from "../actions/createExercise";
import prisma from "@/lib/prisma";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
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
});
