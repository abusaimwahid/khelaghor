import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

export type TestDatabaseKind = "vitest" | "playwright";

export function configureTestDatabase(kind: TestDatabaseKind) {
  const configured = process.env.TEST_DATABASE_URL;
  const username = process.env.USER || process.env.LOGNAME || "postgres";
  const url = new URL(
    configured ??
      `postgresql://${username}@localhost:5432/khelaghor_test_${kind}`,
  );
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname))
    throw new Error("Tests require an isolated localhost PostgreSQL database.");
  url.pathname = `/khelaghor_test_${kind}`;
  const value = url.toString();
  process.env.DATABASE_URL = value;
  process.env.DIRECT_URL = value;
  process.env.APP_ENV = "test";
  return value;
}

export async function ensureTestDatabase() {
  const target = new URL(requiredDatabaseUrl());
  const databaseName = target.pathname.slice(1);
  const adminUrl = new URL(target);
  adminUrl.pathname = "/postgres";
  const admin = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  try {
    const rows = await admin.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${databaseName}) AS "exists"
    `;
    if (!rows[0]?.exists)
      await admin.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await admin.$disconnect();
  }
}

export async function resetTestDatabaseSchema() {
  await ensureTestDatabase();
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS "public" CASCADE');
    await prisma.$executeRawUnsafe('CREATE SCHEMA "public"');
  } finally {
    await prisma.$disconnect();
  }
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: process.env,
    stdio: "ignore",
  });
}

function requiredDatabaseUrl() {
  if (!process.env.DATABASE_URL)
    throw new Error("Test database is not configured.");
  return process.env.DATABASE_URL;
}
