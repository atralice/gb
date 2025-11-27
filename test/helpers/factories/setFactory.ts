import { randomUUID } from "crypto";

import { Set, Prisma } from "@prisma/client";
import createFactory from "./createFactory";
import type { PartialWithRequired } from "./PartialWithRequired";

function buildAttributes(): Set {
  return {
    id: randomUUID(),
    workoutDayExerciseId: randomUUID(),
    setIndex: 1,
    reps: 8,
    weightKg: 60,
    repsPerSide: false,
    rpe: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

type CreateAttributes = PartialWithRequired<
  Prisma.SetCreateInput,
  "workoutDayExercise"
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
