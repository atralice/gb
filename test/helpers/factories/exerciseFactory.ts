import { randomUUID } from "crypto";

import createFactory from "./createFactory";
import type { PartialWithRequired } from "./PartialWithRequired";
import type { Exercise, Prisma } from "@prisma/client";

function buildAttributes(): Exercise {
  return {
    id: randomUUID(),
    name: "Sentadilla búlgara",
    instructions: null,
    videoUrl: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

type CreateAttributes = PartialWithRequired<Prisma.ExerciseCreateInput, never>;

function createAttributes(
  attributes: CreateAttributes
): Prisma.ExerciseCreateInput {
  return {
    name: "Test Exercise",
    ...attributes,
  };
}

const exerciseFactory = createFactory<
  Exercise,
  Prisma.ExerciseCreateInput,
  CreateAttributes
>({
  modelName: "exercise",
  buildAttributes,
  createAttributes,
});

export default exerciseFactory;
