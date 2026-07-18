import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import { bootstrapTestDatabase } from "./bootstrap";
import { resetAndBootstrapTestDatabase } from "./cleanup";

describe("test database bootstrap", () => {
  beforeAll(resetAndBootstrapTestDatabase);

  it("is idempotent and never duplicates unique reference rows", async () => {
    const before = {
      permissions: await prisma.permission.count(),
      roles: await prisma.role.count(),
      zones: await prisma.deliveryZone.count(),
      settings: await prisma.siteSetting.count(),
    };

    await bootstrapTestDatabase(new PrismaClient());
    await bootstrapTestDatabase(new PrismaClient());

    expect({
      permissions: await prisma.permission.count(),
      roles: await prisma.role.count(),
      zones: await prisma.deliveryZone.count(),
      settings: await prisma.siteSetting.count(),
    }).toEqual(before);
  });
});
