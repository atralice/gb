import prisma from "@/lib/prisma";
import { User } from "@prisma/client";

// Helper function to get or create a mock user for development/testing
export async function getOrCreateMockUser(): Promise<User> {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: "test@test.com",
    },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      email: "test@test.com",
    },
  });
}
