import { describe, test, expect, beforeEach } from "bun:test";
import { getTrainerAthletes } from "../getTrainerAthletes";
import userFactory from "test/helpers/factories/userFactory";
import trainerAthleteFactory from "test/helpers/factories/trainerAthleteFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getTrainerAthletes", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns athletes linked to trainer", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete1 = await userFactory.create({
      role: UserRole.athlete,
      name: "Toni",
    });
    const athlete2 = await userFactory.create({
      role: UserRole.athlete,
      name: "Amani",
    });
    const _otherAthlete = await userFactory.create({
      role: UserRole.athlete,
      name: "Other",
    });

    await trainerAthleteFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete1.id } },
    });
    await trainerAthleteFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete2.id } },
    });

    const result = await getTrainerAthletes(trainer.id);

    expect(result).toHaveLength(2);
    expect(result.map((a) => a.name).sort()).toEqual(["Amani", "Toni"]);
    expect(result.find((a) => a.name === "Other")).toBeUndefined();
  });

  test("returns empty array when trainer has no athletes", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });

    const result = await getTrainerAthletes(trainer.id);

    expect(result).toEqual([]);
  });
});
