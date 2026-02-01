import { randomUUID } from "crypto";

import { WorkoutDay, Prisma } from "@prisma/client";
import createFactory from "./createFactory";
import type { PartialWithRequired } from "./PartialWithRequired";

function buildAttributes(): WorkoutDay {
  return {
    id: randomUUID(),
    weekNumber: 1,
    weekStartDate: new Date(Date.UTC(2025, 0, 6)), // 2025-01-06 for weekNumber 1
    dayIndex: 1,
    label: "Día 1",
    datePlanned: null,
    notes: null,
    trainerId: randomUUID(),
    athleteId: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

type CreateAttributes = PartialWithRequired<
  Prisma.WorkoutDayCreateInput,
  "trainer" | "athlete"
>;

function createAttributes(
  attributes: CreateAttributes
): Prisma.WorkoutDayCreateInput {
  return {
    weekNumber: 1,
    weekStartDate: new Date(Date.UTC(2025, 0, 6)), // 2025-01-06 for weekNumber 1
    dayIndex: 1,
    label: "Día 1",
    ...attributes,
  };
}

const workoutDayFactory = createFactory<
  WorkoutDay,
  Prisma.WorkoutDayCreateInput,
  CreateAttributes
>({
  modelName: "workoutDay",
  buildAttributes,
  createAttributes,
});

export default workoutDayFactory;
