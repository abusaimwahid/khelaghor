import { UserStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { createStaff, updateStaff } from "@/server/staff";

const unique = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;

describe("staff lifecycle guardrails", () => {
  it("creates staff safely and rejects duplicate email", async () => {
    const actor = await prisma.user.create({
      data: { email: unique("actor") },
    });
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: "Product Manager" },
    });
    const email = unique("staff");
    const staff = await createStaff({
      actorId: actor.id,
      name: "Product Staff",
      email,
      roleId: role.id,
      temporaryPassword: "Temporary123!",
      active: true,
      forcePasswordChange: true,
    });
    expect(staff.forcePasswordChange).toBe(true);
    await expect(
      createStaff({
        actorId: actor.id,
        name: "Duplicate",
        email,
        roleId: role.id,
        temporaryPassword: "Temporary123!",
        active: true,
        forcePasswordChange: true,
      }),
    ).rejects.toThrow(/unable to create/i);
  });

  it("prevents self-deactivation and preserves the session", async () => {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: "Store Manager" },
    });
    const user = await prisma.user.create({
      data: {
        email: unique("self"),
        roles: { create: { roleId: role.id } },
        sessions: {
          create: {
            sessionToken: crypto.randomUUID(),
            expires: new Date(Date.now() + 60_000),
          },
        },
      },
    });
    await expect(
      updateStaff({
        actorId: user.id,
        staffId: user.id,
        name: "Self",
        roleId: role.id,
        active: false,
        forcePasswordChange: false,
      }),
    ).rejects.toThrow(/own active/i);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).status,
    ).toBe(UserStatus.ACTIVE);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);
  });

  it("keeps an active Super Admin under concurrent deactivation attempts", async () => {
    const superRole = await prisma.role.findUniqueOrThrow({
      where: { name: "Super Admin" },
    });
    const existing = await prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        roles: { some: { roleId: superRole.id } },
      },
      select: { id: true },
    });
    await prisma.user.updateMany({
      where: { id: { in: existing.map((item) => item.id) } },
      data: { status: UserStatus.BLOCKED },
    });
    try {
      const [first, second, actorA, actorB] = await Promise.all([
        prisma.user.create({
          data: {
            email: unique("concurrent-a"),
            name: "Super A",
            roles: { create: { roleId: superRole.id } },
          },
        }),
        prisma.user.create({
          data: {
            email: unique("concurrent-b"),
            name: "Super B",
            roles: { create: { roleId: superRole.id } },
          },
        }),
        prisma.user.create({ data: { email: unique("operator-a") } }),
        prisma.user.create({ data: { email: unique("operator-b") } }),
      ]);
      const results = await Promise.allSettled([
        updateStaff({
          actorId: actorA.id,
          staffId: first.id,
          name: "Super A",
          roleId: superRole.id,
          active: false,
          forcePasswordChange: false,
        }),
        updateStaff({
          actorId: actorB.id,
          staffId: second.id,
          name: "Super B",
          roleId: superRole.id,
          active: false,
          forcePasswordChange: false,
        }),
      ]);
      expect(results.some((result) => result.status === "rejected")).toBe(true);
      expect(
        await prisma.user.count({
          where: {
            status: UserStatus.ACTIVE,
            roles: { some: { roleId: superRole.id } },
          },
        }),
      ).toBeGreaterThanOrEqual(1);
    } finally {
      await prisma.user.updateMany({
        where: { id: { in: existing.map((item) => item.id) } },
        data: { status: UserStatus.ACTIVE },
      });
    }
  });
});
