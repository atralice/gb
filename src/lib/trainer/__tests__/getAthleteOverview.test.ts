import { describe, test, expect, beforeEach } from "bun:test";
import { getAthleteOverview } from "../getAthleteOverview";
import userFactory from "test/helpers/factories/userFactory";
import workoutDayFactory from "test/helpers/factories/workoutDayFactory";
import workoutBlockFactory from "test/helpers/factories/workoutBlockFactory";
import workoutBlockExerciseFactory from "test/helpers/factories/workoutBlockExerciseFactory";
import exerciseFactory from "test/helpers/factories/exerciseFactory";
import setFactory from "test/helpers/factories/setFactory";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";

describe("getAthleteOverview", () => {
  beforeEach(async () => {
    await truncateDb();
  });

  test("returns null for unknown athlete", async () => {
    const result = await getAthleteOverview("non-existent-id");

    expect(result).toBeNull();
  });

  test("returns null when athlete has no workouts", async () => {
    const athlete = await userFactory.create({ role: UserRole.athlete });

    const result = await getAthleteOverview(athlete.id);

    expect(result).toBeNull();
  });

  test("groups workouts by day across weeks", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({
      role: UserRole.athlete,
      name: "Toni",
    });
    const exercise = await exerciseFactory.create({ name: "Peso muerto" });

    // Week 1, Day 1
    const day1w1 = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: new Date("2026-01-05"),
      weekNumber: 1,
      dayIndex: 1,
      label: "Día 1",
      notes: "Warm up 10 min",
    });

    const block1w1 = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day1w1.id } },
      order: 1,
      label: "A",
    });

    const ex1w1 = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block1w1.id } },
      order: 1,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: ex1w1.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 60,
    });

    // Week 2, Day 1
    const day1w2 = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: new Date("2026-01-12"),
      weekNumber: 2,
      dayIndex: 1,
      label: "Día 1",
    });

    const block1w2 = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day1w2.id } },
      order: 1,
      label: "A",
    });

    const ex1w2 = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block1w2.id } },
      order: 1,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: ex1w2.id } },
      setIndex: 1,
      reps: 5,
      weightKg: 65,
    });

    // Week 1, Day 2
    const day2w1 = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: new Date("2026-01-05"),
      weekNumber: 1,
      dayIndex: 2,
      label: "Día 2",
    });

    const block2w1 = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day2w1.id } },
      order: 1,
      label: "A",
    });

    const ex2w1 = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block2w1.id } },
      order: 1,
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: ex2w1.id } },
      setIndex: 1,
      reps: 8,
      weightKg: 50,
    });

    const result = await getAthleteOverview(athlete.id);

    expect(result).not.toBeNull();
    expect(result?.athlete.name).toBe("Toni");
    expect(result?.latestWeekNumber).toBe(2);

    // Should have 2 days
    expect(result?.days).toHaveLength(2);

    // Day 1 should have 2 weeks sorted by weekNumber
    const day1 = result?.days[0];
    expect(day1?.dayIndex).toBe(1);
    expect(day1?.label).toBe("Día 1");
    expect(day1?.notes).toBe("Warm up 10 min");
    expect(day1?.weeks).toHaveLength(2);
    expect(day1?.weeks[0]?.weekNumber).toBe(1);
    expect(day1?.weeks[0]?.exercises[0]?.sets[0]?.weightKg).toBe(60);
    expect(day1?.weeks[1]?.weekNumber).toBe(2);
    expect(day1?.weeks[1]?.exercises[0]?.sets[0]?.weightKg).toBe(65);

    // Day 2 should have 1 week
    const day2 = result?.days[1];
    expect(day2?.dayIndex).toBe(2);
    expect(day2?.label).toBe("Día 2");
    expect(day2?.weeks).toHaveLength(1);
    expect(day2?.weeks[0]?.weekNumber).toBe(1);
  });

  test("includes block label and exercise info", async () => {
    const trainer = await userFactory.create({ role: UserRole.trainer });
    const athlete = await userFactory.create({
      role: UserRole.athlete,
      name: "Toni",
    });
    const exercise = await exerciseFactory.create({ name: "Sentadilla" });

    const day = await workoutDayFactory.create({
      trainer: { connect: { id: trainer.id } },
      athlete: { connect: { id: athlete.id } },
      weekStartDate: new Date("2026-01-05"),
      weekNumber: 1,
      dayIndex: 1,
    });

    const block = await workoutBlockFactory.create({
      workoutDay: { connect: { id: day.id } },
      order: 1,
      label: "A",
      comment: "Descanso 60 seg entre series",
    });

    const workoutExercise = await workoutBlockExerciseFactory.create({
      exercise: { connect: { id: exercise.id } },
      workoutBlock: { connect: { id: block.id } },
      order: 2,
      comment: "No balancear",
    });

    await setFactory.create({
      workoutBlockExercise: { connect: { id: workoutExercise.id } },
      setIndex: 1,
      reps: 10,
      weightKg: 40,
      repsPerSide: true,
    });

    const result = await getAthleteOverview(athlete.id);

    expect(result).not.toBeNull();
    const ex = result?.days[0]?.weeks[0]?.exercises[0];
    expect(ex?.exerciseName).toBe("Sentadilla");
    expect(ex?.blockLabel).toBe("A");
    expect(ex?.blockComment).toBe("Descanso 60 seg entre series");
    expect(ex?.exerciseOrder).toBe(2);
    expect(ex?.exerciseComment).toBe("No balancear");
    expect(ex?.sets[0]?.repsPerSide).toBe(true);
    expect(ex?.sets[0]?.reps).toBe(10);
    expect(ex?.sets[0]?.weightKg).toBe(40);
  });
});
