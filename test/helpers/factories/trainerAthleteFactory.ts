import { randomUUID } from "crypto";

import { TrainerAthlete, Prisma } from "@prisma/client";
import createFactory from "./createFactory";
import type { PartialWithRequired } from "./PartialWithRequired";

function buildAttributes(): TrainerAthlete {
  return {
    trainerId: randomUUID(),
    athleteId: randomUUID(),
    createdAt: new Date(),
  };
}

type CreateAttributes = PartialWithRequired<
  Prisma.TrainerAthleteCreateInput,
  "trainer" | "athlete"
>;

function createAttributes(
  attributes: CreateAttributes
): Prisma.TrainerAthleteCreateInput {
  return {
    ...attributes,
  };
}

const trainerAthleteFactory = createFactory<
  TrainerAthlete,
  Prisma.TrainerAthleteCreateInput,
  CreateAttributes
>({
  modelName: "trainerAthlete",
  buildAttributes,
  createAttributes,
});

export default trainerAthleteFactory;
