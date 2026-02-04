import { describe, test, expect, beforeEach } from "bun:test";
import { getAthleteStats } from "../getAthleteStats";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getAthleteStats", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  describe("weeklyCompletion", () => {
    test("counts completed, skipped, and total sets for current week", async () => {
      const trainer = await userFactory.create({ role: UserRole.trainer });
      const athlete = await userFactory.create({ role: UserRole.athlete });
      const exercise = await exerciseFactory.create();

      // Current week (use a Monday as weekStartDate)
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

      // 3 completed, 2 skipped, 1 pending = 6 total
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
        skipped: true,
      });
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 5,
        skipped: true,
      });
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 6,
        completed: false,
        skipped: false,
      });

      const result = await getAthleteStats(athlete.id, "week");

      expect(result.weeklyCompletion).toEqual({
        completed: 3,
        skipped: 2,
        total: 6,
      });
    });
  });

  describe("adherence", () => {
    test("calculates average weight and reps difference for week", async () => {
      const trainer = await userFactory.create({ role: UserRole.trainer });
      const athlete = await userFactory.create({ role: UserRole.athlete });
      const exercise = await exerciseFactory.create();

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

      // Set 1: prescribed 60kg x 8, actual 62kg x 8 (+2kg, 0 reps)
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 1,
        weightKg: 60,
        reps: 8,
        actualWeightKg: 62,
        actualReps: 8,
        completed: true,
      });

      // Set 2: prescribed 60kg x 8, actual 64kg x 7 (+4kg, -1 rep)
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 2,
        weightKg: 60,
        reps: 8,
        actualWeightKg: 64,
        actualReps: 7,
        completed: true,
      });

      // Skipped set should not count
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 3,
        weightKg: 60,
        reps: 8,
        skipped: true,
      });

      const result = await getAthleteStats(athlete.id, "week");

      // Average: (+2 + +4) / 2 = +3kg, (0 + -1) / 2 = -0.5 reps
      expect(result.adherence.range).toBe("week");
      expect(result.adherence.avgWeightDiff).toBe(3);
      expect(result.adherence.avgRepsDiff).toBe(-0.5);
    });

    test("returns null when no completed sets with actual values", async () => {
      const athlete = await userFactory.create({ role: UserRole.athlete });

      const result = await getAthleteStats(athlete.id, "week");

      expect(result.adherence.avgWeightDiff).toBeNull();
      expect(result.adherence.avgRepsDiff).toBeNull();
    });
  });
});
