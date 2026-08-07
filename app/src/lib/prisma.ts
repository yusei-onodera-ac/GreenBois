import { PrismaClient } from "@prisma/client";

// Next.jsの開発時ホットリロードで複数コネクションが生成されるのを防ぐ定石パターン
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
