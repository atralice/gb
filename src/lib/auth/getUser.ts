import "server-only";
import type { User } from "@prisma/client";

export type SessionUser = User | null;
export type NonNullableSessionUser = NonNullable<SessionUser>;

/**
 * Get the current authenticated user.
 * TODO: Implement actual auth (NextAuth, Clerk, etc.)
 */
export default async function getUser(): Promise<SessionUser> {
  // TODO: Replace with actual auth implementation
  // For now, return null (not authenticated)
  return null;
}
