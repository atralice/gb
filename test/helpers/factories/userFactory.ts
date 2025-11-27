import { randomUUID } from "crypto";

import { User, Prisma, UserRole } from "@prisma/client";
import createFactory from "./createFactory";
import type { PartialWithRequired } from "./PartialWithRequired";

function buildAttributes(): User {
  return {
    id: randomUUID(),
    email: `test-${randomUUID()}@example.com`,
    name: "Test User",
    role: UserRole.athlete,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

type CreateAttributes = PartialWithRequired<Prisma.UserCreateInput, never>;

function createAttributes(
  attributes: CreateAttributes
): Prisma.UserCreateInput {
  return {
    email: `test-${randomUUID()}@example.com`,
    name: "Test User",
    role: UserRole.athlete,
    ...attributes,
  };
}

const userFactory = createFactory<
  User,
  Prisma.UserCreateInput,
  CreateAttributes
>({
  modelName: "user",
  buildAttributes,
  createAttributes,
});

export default userFactory;
