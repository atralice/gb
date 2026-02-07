import { describe, test, expect, beforeEach } from "bun:test";
import { getAthleteWeek } from "../getAthleteWeek";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getAthleteWeek", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns week data with days, exercises, and sets", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({
      role: UserRole.athlete,
      name: "Toni",
    });
    const exercise = await exerciseFactory.create({ name: "Peso muerto" });

    const weekStartDate = new Date("2026-02-02");

    const day1 = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate,
      weekNumber: 5,
      dayIndex: 1,
      label: "Día 1",
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day1.id } },
      order: 1,
      label: "A",
    });

    const workoutExercise = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 60,
      actualReps: 5,
      actualWeightKg: 62,
      completed: true,
    });

    const result = await getAthleteWeek(athlete.id, 5);

    expect(result).not.toBeNull();
    expect(result?.athlete.name).toBe("Toni");
    expect(result?.weekNumber).toBe(5);
    expect(result?.days).toHaveLength(1);
    expect(result?.days[0]?.dayIndex).toBe(1);
    expect(result?.days[0]?.exercises).toHaveLength(1);
    expect(result?.days[0]?.exercises[0]?.exerciseName).toBe("Peso muerto");
    expect(result?.days[0]?.exercises[0]?.sets).toHaveLength(1);
    expect(result?.days[0]?.exercises[0]?.sets[0]).toMatchObject({
      reps: 5,
      weightKg: 60,
      actualReps: 5,
      actualWeightKg: 62,
    });
  });

  test("returns null when week not found", async () => {
    const athlete = await userFactory.create({ role: UserRole.athlete });

    const result = await getAthleteWeek(athlete.id, 999);

    expect(result).toBeNull();
  });

  test("includes previous and next week existence flags", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });

    // Create weeks 4, 5, 6
    const weekDates = [
      new Date("2026-01-19"),
      new Date("2026-01-26"),
      new Date("2026-02-02"),
    ];
    for (const [i, weekNum] of [4, 5, 6].entries()) {
      await workoutDayFactory.create({
        trainer: { connect: { id: trainer.id } },
        athlete: { connect: { id: athlete.id } },
        weekStartDate: weekDates[i],
        weekNumber: weekNum,
        dayIndex: 1,
      });
    }

    const result = await getAthleteWeek(athlete.id, 5);

    expect(result?.previousWeekExists).toBe(true);
    expect(result?.nextWeekExists).toBe(true);

    const resultFirst = await getAthleteWeek(athlete.id, 4);
    expect(resultFirst?.previousWeekExists).toBe(false);

    const resultLast = await getAthleteWeek(athlete.id, 6);
    expect(resultLast?.nextWeekExists).toBe(false);
  });
});
