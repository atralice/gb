import { describe, it, expect, beforeEach } from "bun:test";
import { getSuggestedWorkoutDay } from "../getSuggestedWorkoutDay";
import truncateDb from "test/helpers/test-helpers";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";

describe("getSuggestedWorkoutDay", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  it("returns null when athlete has no workout days", async () => {
    const athlete = await userFactory.create({ role: "athlete" });

    const result = await getSuggestedWorkoutDay(athlete.id);

    expect(result).toBeNull();
  });

  it("returns day 1 of latest week when no days completed", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const athlete = await userFactory.create({ role: "athlete" });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 4,
      weekStartDate: new Date(Date.UTC(2025, 0, 27)),
      dayIndex: 1,
    });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 4,
      weekStartDate: new Date(Date.UTC(2025, 0, 27)),
      dayIndex: 2,
    });

    const result = await getSuggestedWorkoutDay(athlete.id);

    expect(result).toEqual({ weekNumber: 4, dayIndex: 1 });
  });

  it("returns latest week by weekStartDate, not weekNumber", async () => {
    const trainer = await userFactory.create({ role: "trainer" });
    const athlete = await userFactory.create({ role: "athlete" });

    // Week 10 has an earlier weekStartDate than week 3
    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 10,
      weekStartDate: new Date(Date.UTC(2025, 0, 6)),
      dayIndex: 1,
    });

    await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekNumber: 3,
      weekStartDate: new Date(Date.UTC(2025, 0, 27)),
      dayIndex: 1,
    });

    const result = await getSuggestedWorkoutDay(athlete.id);

    expect(result).toEqual({ weekNumber: 3, dayIndex: 1 });
  });
});
