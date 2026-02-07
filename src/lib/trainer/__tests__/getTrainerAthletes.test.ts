import { describe, test, expect, beforeEach } from "bun:test";
import { getTrainerAthletes } from "../getTrainerAthletes";
import userFactory from "test/helpers/factories/userFactory";
import trainerAthleteFactory from "test/helpers/factories/trainerAthleteFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
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

  test("calculates weekly completion for current week", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({ role: UserRole.athlete });
    const exercise = await exerciseFactory.create();

    await trainerAthleteFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
    });

    // Current week
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const workoutDay = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: monday,
      weekNumber: 1,
      dayIndex: 1,
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: workoutDay.id } },
      order: 1,
    });

    const workoutExercise = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 1,
    });

    // 3 completed, 1 pending = 4 total
    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      completed: true,
    });
    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 2,
      completed: true,
    });
    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 3,
      completed: true,
    });
    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 4,
      completed: false,
    });

    const result = await getTrainerAthletes(trainer.id);

    expect(result[0]?.weeklyCompletion).toEqual({
      completed: 3,
      total: 4,
    });
  });

  test("returns empty array when trainer has no athletes", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });

    const result = await getTrainerAthletes(trainer.id);

    expect(result).toEqual([]);
  });
});
