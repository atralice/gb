import { describe, test, expect, beforeEach } from "bun:test";
import prisma from "@/lib/prisma";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import userFactory from "test/helpers/factories/userFactory";
import truncateDb from "test/helpers/test-helpers";
import { copyGlobalExercise } from "../actions/copyGlobalExercise";

describe("copyGlobalExercise", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("copies global exercise into trainer library", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const global = await exerciseFactory.create({ name: "Squat" });

    const copy = await copyGlobalExercise(global.id, trainer.id);

    const found = await prisma.exercise.findUnique({ where: { id: copy.id } });
    expect(found?.name).toBe("Squat");
    expect(found?.ownerId).toBe(trainer.id);
    expect(found?.globalSourceId).toBe(global.id);
    expect(copy.id).not.toBe(global.id);
  });

  test("returns existing copy if trainer already has exercise with same name", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const global = await exerciseFactory.create({ name: "Squat" });
    const existing = await exerciseFactory.create({
      name: "Squat",
      owner: { connect: { id: trainer.id } },
    });

    const result = await copyGlobalExercise(global.id, trainer.id);

    expect(result.id).toBe(existing.id);
    const count = await prisma.exercise.count({
      where: { ownerId: trainer.id },
    });
    expect(count).toBe(1);
  });

  test("copies exerciseType, instructions, tags from global", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const global = await exerciseFactory.create({
      name: "Plank",
      exerciseType: "timed",
      instructions: "Keep core tight",
      tags: ["core", "isometric"],
    });

    const copy = await copyGlobalExercise(global.id, trainer.id);

    const found = await prisma.exercise.findUnique({ where: { id: copy.id } });
    expect(found?.exerciseType).toBe("timed");
    expect(found?.instructions).toBe("Keep core tight");
    expect(found?.tags).toEqual(["core", "isometric"]);
  });
});
