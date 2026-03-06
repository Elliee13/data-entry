import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseEnv } from "@/lib/env";

declare global {
  var prismaClientSingleton: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getDatabaseEnv().DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
  });
}

export const db = globalThis.prismaClientSingleton ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClientSingleton = db;
}
