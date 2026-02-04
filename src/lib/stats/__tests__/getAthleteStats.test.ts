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

      // Current week (use a Monday as weekStartDate) - UTC based
      const today = new Date();
      const dayOfWeek = today.getUTCDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - daysToSubtract
        )
      );

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

      expect(result.weeklyCompletion.completed).toBe(3);
      expect(result.weeklyCompletion.skipped).toBe(2);
      expect(result.weeklyCompletion.total).toBe(6);
      expect(result.weeklyCompletion.weekStart).toBeInstanceOf(Date);
      expect(result.weeklyCompletion.weekEnd).toBeInstanceOf(Date);
    });
  });

  describe("adherence", () => {
    test("calculates average weight and reps difference for week", async () => {
      const trainer = await userFactory.create({ role: UserRole.trainer });
      const athlete = await userFactory.create({ role: UserRole.athlete });
      const exercise = await exerciseFactory.create();

      // Current week (use a Monday as weekStartDate) - UTC based
      const today = new Date();
      const dayOfWeek = today.getUTCDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - daysToSubtract
        )
      );

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

  describe("personalRecords", () => {
    test("returns top 5 exercises by max weight", async () => {
      const trainer = await userFactory.create({ role: UserRole.trainer });
      const athlete = await userFactory.create({ role: UserRole.athlete });

      const exercises = await Promise.all([
        exerciseFactory.create({ name: "Deadlift" }),
        exerciseFactory.create({ name: "Squat" }),
        exerciseFactory.create({ name: "Bench" }),
        exerciseFactory.create({ name: "Row" }),
        exerciseFactory.create({ name: "Press" }),
        exerciseFactory.create({ name: "Curl" }), // 6th - should not appear
      ]);

      const workoutDay = await workoutDayFactory.create({
        trainer: { connect: { id: trainer.id } },
        athlete: { connect: { id: athlete.id } },
        weekStartDate: new Date(),
        weekNumber: 1,
        dayIndex: 1,
      });

      const block = await workoutBlockFactory.create({
        workoutDay: { connect: { id: workoutDay.id } },
        order: 1,
      });

      // Create sets with different max weights
      const weights = [100, 80, 70, 60, 50, 40]; // Curl at 40 should be excluded
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        if (!exercise) continue;
        const workoutExercise = await workoutBlockExerciseFactory.create({
          exercise: { connect: { id: exercise.id } },
          workoutBlock: { connect: { id: block.id } },
          order: i + 1,
        });

        await setFactory.create({
          workoutBlockExercise: { connect: { id: workoutExercise.id } },
          setIndex: 1,
          actualWeightKg: weights[i],
          completed: true,
        });
      }

      const result = await getAthleteStats(athlete.id, "week");

      expect(result.personalRecords).toHaveLength(5);
      expect(result.personalRecords[0]?.exerciseName).toBe("Deadlift");
      expect(result.personalRecords[0]?.weightKg).toBe(100);
      expect(result.personalRecords[4]?.exerciseName).toBe("Press");
      expect(result.personalRecords[4]?.weightKg).toBe(50);
    });

    test("only counts completed sets", async () => {
      const trainer = await userFactory.create({ role: UserRole.trainer });
      const athlete = await userFactory.create({ role: UserRole.athlete });
      const exercise = await exerciseFactory.create({ name: "Deadlift" });

      const workoutDay = await workoutDayFactory.create({
        trainer: { connect: { id: trainer.id } },
        athlete: { connect: { id: athlete.id } },
        weekStartDate: new Date(),
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

      // Skipped set with higher weight should not count
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 1,
        actualWeightKg: 200,
        skipped: true,
      });

      // Completed set with lower weight
      await setFactory.create({
        workoutBlockExercise: { connect: { id: workoutExercise.id } },
        setIndex: 2,
        actualWeightKg: 100,
        completed: true,
      });

      const result = await getAthleteStats(athlete.id, "week");

      expect(result.personalRecords).toHaveLength(1);
      expect(result.personalRecords[0]?.weightKg).toBe(100);
    });
  });
});
