import { randomUUID } from "crypto";

import type { Set, Prisma } from "@prisma/client";
import createFactory from "./createFactory";
import type { PartialWithRequired } from "./PartialWithRequired";

function buildAttributes(): Set {
  return {
    id: randomUUID(),
    workoutBlockExerciseId: randomUUID(),
    setIndex: 1,
    reps: 8,
    weightKg: 60,
    durationSeconds: null,
    repsPerSide: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

type CreateAttributes = PartialWithRequired<
  Prisma.SetCreateInput,
  "workoutBlockExercise"
>;

function createAttributes(attributes: CreateAttributes): Prisma.SetCreateInput {
  return {
    setIndex: 1,
    reps: 8,
    weightKg: 60,
    repsPerSide: false,
    ...attributes,
  };
}

const setFactory = createFactory<Set, Prisma.SetCreateInput, CreateAttributes>({
  modelName: "set",
  buildAttributes,
  createAttributes,
});

export default setFactory;
