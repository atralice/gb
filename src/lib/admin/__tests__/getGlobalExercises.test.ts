import { describe, test, expect, beforeEach } from "bun:test";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import userFactory from "test/helpers/factories/userFactory";
import truncateDb from "test/helpers/test-helpers";
import { getGlobalExercises } from "../getGlobalExercises";

describe("getGlobalExercises", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns only global exercises", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    await exerciseFactory.create({ name: "Global Squat" });
    await exerciseFactory.create({
      name: "Trainer Squat",
      owner: { connect: { id: trainer.id } },
    });

    const results = await getGlobalExercises();

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Global Squat");
  });

  test("filters by search query", async () => {
    await exerciseFactory.create({ name: "Squat" });
    await exerciseFactory.create({ name: "Bench Press" });

    const results = await getGlobalExercises({ search: "squat" });

    expect(results).toHaveLength(1);
  });
});
