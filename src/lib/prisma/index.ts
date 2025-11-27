import { PrismaClient } from "@prisma/client";
import { env } from "@/env.config";

// In development, use a singleton of Prisma to avoid too many db connections from hot reloading Next.js
// See: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
declare const globalThis: {
  prismaGlobal: PrismaClient;
} & typeof global;

function initializePrismaClient() {
  const prismaClientSingleton = () => {
    return new PrismaClient();
  };

  const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

  if (env.NEXT_PUBLIC_APP_ENV !== "production") {
    globalThis.prismaGlobal = prisma;
  }

  return prisma;
}

const prisma = initializePrismaClient();

export default prisma;
