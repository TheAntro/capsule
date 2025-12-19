import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import Database from "better-sqlite3";

const connectionString = process.env.DATABASE_URL || "file:/app/data/prod.db";

// better-sqlite3 wants a raw path, not a "file:" URI
const pathToDb = connectionString.replace("file:", "");

const adapter = new PrismaBetterSQLite3({ url: pathToDb });

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
