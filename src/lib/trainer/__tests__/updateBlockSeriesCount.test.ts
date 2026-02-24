import { describe, test, expect, beforeEach } from "bun:test";
import { updateBlockSeriesCount } from "../actions/updateBlockSeriesCount";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

// Helper to create a block with 2 exercises, each having `seriesCount` sets
async function createBlockWith2Exercises(seriesCount: number) {
  const trainer = await userFactory.create({ role: UserRole.trainer });
  const athlete = await userFactory.create({ role: UserRole.athlete });
  const ex1 = await exerciseFactory.create({ name: "Exercise A" });
  const ex2 = await exerciseFactory.create({ name: "Exercise B" });

  const day = await workoutDayFactory.create({
    trainer: { connect: { id: trainer.id } },
    athlete: { connect: { id: athlete.id } },
    weekNumber: 5,
    dayIndex: 1,
  });

  const block = await workoutBlockFactory.create({
    workoutDay: { connect: { id: day.id } },
    order: 1,
    label: "A",
  });

  const wbe1 = await workoutBlockExerciseFactory.create({
    exercise: { connect: { id: ex1.id } },
    workoutBlock: { connect: { id: block.id } },
    order: 1,
  });

  const wbe2 = await workoutBlockExerciseFactory.create({
    exercise: { connect: { id: ex2.id } },
    workoutBlock: { connect: { id: block.id } },
    order: 2,
  });

  for (const wbe of [wbe1, wbe2]) {
    for (let i = 1; i <= seriesCount; i++) {
      await setFactory.create({
        workoutBlockExercise: { connect: { id: wbe.id } },
        setIndex: i,
        reps: 8,
        weightKg: 60,
      });
    }
  }

  return { block, wbe1, wbe2 };
}

describe("updateBlockSeriesCount", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("adds a series to all exercises in a block", async () => {
    const { block, wbe1, wbe2 } = await createBlockWith2Exercises(3);
    await updateBlockSeriesCount(block.id, 4);

    const sets1 = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe1.id },
      orderBy: { setIndex: "asc" },
    });
    const sets2 = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe2.id },
      orderBy: { setIndex: "asc" },
    });

    expect(sets1).toHaveLength(4);
    expect(sets2).toHaveLength(4);

    const newSet = sets1[3];
    if (!newSet) throw new Error("Expected set at index 3");
    expect(newSet.setIndex).toBe(4);
    expect(newSet.reps).toBeNull();
    expect(newSet.weightKg).toBeNull();
  });

  test("removes last series from all exercises in a block", async () => {
    const { block, wbe1, wbe2 } = await createBlockWith2Exercises(3);
    await updateBlockSeriesCount(block.id, 2);

    const sets1 = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe1.id },
    });
    const sets2 = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe2.id },
    });

    expect(sets1).toHaveLength(2);
    expect(sets2).toHaveLength(2);
  });

  test("does nothing when count is the same", async () => {
    const { block, wbe1 } = await createBlockWith2Exercises(3);
    await updateBlockSeriesCount(block.id, 3);

    const sets = await prisma.set.findMany({
      where: { workoutBlockExerciseId: wbe1.id },
    });
    expect(sets).toHaveLength(3);
  });
});
