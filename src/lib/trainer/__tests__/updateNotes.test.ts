import { describe, it, expect, beforeEach } from "bun:test";
import truncateDb from "test/helpers/test-helpers";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import { UserRole } from "@prisma/client";
import { updateDayNotes } from "../actions/updateDayNotes";
import { updateBlockComment } from "../actions/updateBlockComment";
import { updateExerciseComment } from "../actions/updateExerciseComment";

let trainer: Awaited<ReturnType<typeof userFactory.create>>;
let athlete: Awaited<ReturnType<typeof userFactory.create>>;
let day: Awaited<ReturnType<typeof workoutDayFactory.create>>;
let block: Awaited<ReturnType<typeof workoutBlockFactory.create>>;
let exercise: Awaited<ReturnType<typeof exerciseFactory.create>>;
let blockExercise: Awaited<
  ReturnType<typeof workoutBlockExerciseFactory.create>
>;

beforeEach(async () => {
  await truncateDb();
  trainer = await userFactory.create({ role: UserRole.trainer });
  athlete = await userFactory.create({ role: UserRole.athlete });
  exercise = await exerciseFactory.create();
  day = await workoutDayFactory.create({
    trainer: { connect: { id: trainer.id } },
    athlete: { connect: { id: athlete.id } },
  });
  block = await workoutBlockFactory.create({
    workoutDay: { connect: { id: day.id } },
  });
  blockExercise = await workoutBlockExerciseFactory.create({
    workoutBlock: { connect: { id: block.id } },
    exercise: { connect: { id: exercise.id } },
  });
});

describe("updateDayNotes", () => {
  it("updates day notes", async () => {
    await updateDayNotes(day.id, "Warm up well today");
    const updated = await workoutDayFactory.reload(day.id);
    expect(updated.notes).toBe("Warm up well today");
  });

  it("clears day notes with empty string", async () => {
    await updateDayNotes(day.id, "Some note");
    await updateDayNotes(day.id, "");
    const updated = await workoutDayFactory.reload(day.id);
    expect(updated.notes).toBe("");
  });
});

describe("updateBlockComment", () => {
  it("updates block comment", async () => {
    await updateBlockComment(block.id, "90s rest between sets");
    const updated = await workoutBlockFactory.reload(block.id);
    expect(updated.comment).toBe("90s rest between sets");
  });
});

describe("updateExerciseComment", () => {
  it("updates exercise comment", async () => {
    await updateExerciseComment(blockExercise.id, "Reps por lado");
    const updated = await workoutBlockExerciseFactory.reload(blockExercise.id);
    expect(updated.comment).toBe("Reps por lado");
  });
});
