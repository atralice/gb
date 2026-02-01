import { randomUUID } from "crypto";

import createFactory from "./createFactory";
import type { PartialWithRequired } from "./PartialWithRequired";
import type { WorkoutBlock, Prisma } from "@prisma/client";

function buildAttributes(): WorkoutBlock {
  return {
    id: randomUUID(),
    workoutDayId: randomUUID(),
    order: 1,
    label: "Bloque A",
    comment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

type CreateAttributes = PartialWithRequired<
  Prisma.WorkoutBlockCreateInput,
  "workoutDay"
>;

function createAttributes(
  attributes: CreateAttributes
): Prisma.WorkoutBlockCreateInput {
  return {
    order: 1,
    label: "Bloque A",
    ...attributes,
  };
}

const workoutBlockFactory = createFactory<
  WorkoutBlock,
  Prisma.WorkoutBlockCreateInput,
  CreateAttributes
>({
  modelName: "workoutBlock",
  buildAttributes,
  createAttributes,
});

export default workoutBlockFactory;
