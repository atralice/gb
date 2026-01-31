import { randomUUID } from "crypto";

import { WorkoutDayExercise, Prisma } from "@prisma/client";
import createFactory from "./createFactory";
import type { PartialWithRequired } from "./PartialWithRequired";

function buildAttributes(): WorkoutDayExercise {
  return {
    id: randomUUID(),
    exerciseId: randomUUID(),
    workoutDayId: randomUUID(),
    block: "a",
    order: 1,
    comment: null,
    variants: [],
    sessionDate: new Date(),
    rpe: null,
    generalFeeling: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

type CreateAttributes = PartialWithRequired<
  Prisma.WorkoutDayExerciseCreateInput,
  "exercise" | "workoutDay"
>;

function createAttributes(
  attributes: CreateAttributes
): Prisma.WorkoutDayExerciseCreateInput {
  return {
    block: "a",
    order: 1,
    sessionDate: new Date(),
    ...attributes,
  };
}

const workoutDayExerciseFactory = createFactory<
  WorkoutDayExercise,
  Prisma.WorkoutDayExerciseCreateInput,
  CreateAttributes
>({
  modelName: "workoutDayExercise",
  buildAttributes,
  createAttributes,
});

export default workoutDayExerciseFactory;
