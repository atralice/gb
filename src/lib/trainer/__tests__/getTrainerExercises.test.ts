import { describe, test, expect, beforeEach } from "bun:test";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import userFactory from "test/helpers/factories/userFactory";
import truncateDb from "test/helpers/test-helpers";
import { getTrainerExercises } from "../getTrainerExercises";

describe("getTrainerExercises", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns only exercises owned by the trainer", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const other = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({
      name: "Mine",
      owner: { connect: { id: trainer.id } },
    });
    await exerciseFactory.create({
      name: "Theirs",
      owner: { connect: { id: other.id } },
    });
    await exerciseFactory.create({ name: "Global" }); // global

    const results = await getTrainerExercises(trainer.id);

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Mine");
  });

  test("filters by search query", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({
      name: "Squat",
      owner: { connect: { id: trainer.id } },
    });
    await exerciseFactory.create({
      name: "Bench Press",
      owner: { connect: { id: trainer.id } },
    });

    const results = await getTrainerExercises(trainer.id, { search: "squat" });

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Squat");
  });

  test("filters by exercise type", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({
      name: "Squat",
      exerciseType: "weighted",
      owner: { connect: { id: trainer.id } },
    });
    await exerciseFactory.create({
      name: "Plank",
      exerciseType: "timed",
      owner: { connect: { id: trainer.id } },
    });

    const results = await getTrainerExercises(trainer.id, { type: "timed" });

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Plank");
  });
});
