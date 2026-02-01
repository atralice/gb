import { spyOn } from "bun:test";
import type { User } from "@prisma/client";
import * as getUserModule from "@/lib/auth/getUser";

type GetUserReturnType = ReturnType<typeof getUserModule.default>;

export function mockGetUser(user: User) {
  return spyOn(getUserModule, "default").mockImplementation(
    (): GetUserReturnType => Promise.resolve(user)
  );
}

export function mockGetUserLoggedOut() {
  return spyOn(getUserModule, "default").mockImplementation(
    (): GetUserReturnType => Promise.resolve(null)
  );
}
