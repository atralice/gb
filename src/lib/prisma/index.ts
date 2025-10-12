import { PrismaClient } from "@prisma/client";

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

  if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = prisma;
  }

  return prisma;
}

const prisma = initializePrismaClient();

export default prisma;
