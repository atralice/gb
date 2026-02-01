import { randomUUID } from "crypto";

import createFactory from "./createFactory";
import type { PartialWithRequired } from "./PartialWithRequired";
import type { WorkoutBlockExercise, Prisma } from "@prisma/client";

function buildAttributes(): WorkoutBlockExercise {
  return {
    id: randomUUID(),
    workoutBlockId: randomUUID(),
    exerciseId: randomUUID(),
    order: 1,
    comment: null,
    variants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

type CreateAttributes = PartialWithRequired<
  Prisma.WorkoutBlockExerciseCreateInput,
  "workoutBlock" | "exercise"
>;

function createAttributes(
  attributes: CreateAttributes
): Prisma.WorkoutBlockExerciseCreateInput {
  return {
    order: 1,
    ...attributes,
  };
}

const workoutBlockExerciseFactory = createFactory<
  WorkoutBlockExercise,
  Prisma.WorkoutBlockExerciseCreateInput,
  CreateAttributes
>({
  modelName: "workoutBlockExercise",
  buildAttributes,
  createAttributes,
});

export default workoutBlockExerciseFactory;
