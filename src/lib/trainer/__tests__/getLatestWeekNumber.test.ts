import { describe, test, expect, beforeEach } from "bun:test";
import { getLatestWeekNumber } from "../getLatestWeekNumber";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getLatestWeekNumber", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns highest week number for athlete", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: new Date("2026-01-19"),
      weekNumber: 3,
      dayIndex: 1,
    });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: new Date("2026-02-02"),
      weekNumber: 5,
      dayIndex: 1,
    });

    const result = await getLatestWeekNumber(athlete.id);

    expect(result).toBe(5);
  });

  test("returns null when athlete has no workouts", async () => {
    const athlete = await userFactory.create({ role: UserRole.athlete });

    const result = await getLatestWeekNumber(athlete.id);

    expect(result).toBeNull();
  });
});
