import "server-only";
import type { User } from "@prisma/client";
import { getSessionPayload } from "./cookies";
import prisma from "@/lib/prisma";

export type SessionUser = User | null;
export type NonNullableSessionUser = NonNullable<SessionUser>;

/**
 * Get the current authenticated user from the session cookie.
 */
export default async function getUser(): Promise<SessionUser> {
  const session = await getSessionPayload();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  return user;
}
