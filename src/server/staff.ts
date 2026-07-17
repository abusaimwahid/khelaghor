import { Prisma, UserStatus } from "@prisma/client";
import { prisma } from "./db";
import { hashPassword } from "./security";

export const staffRoles = [
  "Super Admin",
  "Store Manager",
  "Product Manager",
  "Order Manager",
  "Warehouse Staff",
  "Customer Support",
  "Content Manager",
  "Accountant",
] as const;

export function assertStrongTemporaryPassword(password: string) {
  if (
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  )
    throw new Error(
      "Temporary password must be at least 12 characters and include upper, lower, number and symbol.",
    );
}

export async function createStaff(input: {
  actorId: string;
  name: string;
  email: string;
  roleId: string;
  temporaryPassword: string;
  active: boolean;
  forcePasswordChange: boolean;
  note?: string;
  allowPermissionIds?: string[];
  denyPermissionIds?: string[];
}) {
  assertStrongTemporaryPassword(input.temporaryPassword);
  return prisma.$transaction(
    async (tx) => {
      const role = await tx.role.findUnique({ where: { id: input.roleId } });
      if (!role) throw new Error("Selected role is unavailable.");
      const existing = await tx.user.findUnique({
        where: { email: input.email.toLowerCase() },
        select: { id: true },
      });
      if (existing)
        throw new Error("Unable to create staff with those details.");
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email: input.email.toLowerCase(),
          passwordHash: await hashPassword(input.temporaryPassword),
          status: input.active ? UserStatus.ACTIVE : UserStatus.BLOCKED,
          forcePasswordChange: input.forcePasswordChange,
          staffNote: input.note?.trim() || null,
          roles: { create: { roleId: role.id } },
          permissionOverrides: {
            create: [
              ...(input.allowPermissionIds ?? []).map((permissionId) => ({
                permissionId,
                effect: "ALLOW",
              })),
              ...(input.denyPermissionIds ?? []).map((permissionId) => ({
                permissionId,
                effect: "DENY",
              })),
            ],
          },
        },
      });
      await tx.auditLog.create({
        data: {
          userId: input.actorId,
          action: "staff.create",
          entity: "User",
          entityId: user.id,
          metadata: { role: role.name, active: input.active },
        },
      });
      return user;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

async function activeSuperAdminCount(tx: Prisma.TransactionClient) {
  return tx.user.count({
    where: {
      status: UserStatus.ACTIVE,
      roles: { some: { role: { name: "Super Admin" } } },
    },
  });
}

export async function updateStaff(input: {
  actorId: string;
  staffId: string;
  name: string;
  roleId: string;
  active: boolean;
  forcePasswordChange: boolean;
  note?: string;
  allowPermissionIds?: string[];
  denyPermissionIds?: string[];
}) {
  return prisma.$transaction(
    async (tx) => {
      const [target, role] = await Promise.all([
        tx.user.findUnique({
          where: { id: input.staffId },
          include: { roles: { include: { role: true } } },
        }),
        tx.role.findUnique({ where: { id: input.roleId } }),
      ]);
      if (!target || !role) throw new Error("Staff record is unavailable.");
      const wasSuper = target.roles.some(
        (item) => item.role.name === "Super Admin",
      );
      const removesSuper = wasSuper && role.name !== "Super Admin";
      const deactivates = target.status === UserStatus.ACTIVE && !input.active;
      if (input.actorId === target.id && (deactivates || removesSuper)) {
        await tx.auditLog.create({
          data: {
            userId: input.actorId,
            action: "staff.guardrail.blocked",
            entity: "User",
            entityId: target.id,
            metadata: { reason: "self-access-removal" },
          },
        });
        throw new Error(
          "You cannot remove your own active administrative access.",
        );
      }
      if (
        wasSuper &&
        (deactivates || removesSuper) &&
        (await activeSuperAdminCount(tx)) <= 1
      ) {
        await tx.auditLog.create({
          data: {
            userId: input.actorId,
            action: "staff.guardrail.blocked",
            entity: "User",
            entityId: target.id,
            metadata: { reason: "final-super-admin" },
          },
        });
        throw new Error(
          "The final active Super Admin cannot be deactivated or demoted.",
        );
      }
      await tx.userRole.deleteMany({ where: { userId: target.id } });
      await tx.userRole.create({
        data: { userId: target.id, roleId: role.id },
      });
      await tx.userPermissionOverride.deleteMany({
        where: { userId: target.id },
      });
      const overrides = [
        ...(input.allowPermissionIds ?? []).map((permissionId) => ({
          userId: target.id,
          permissionId,
          effect: "ALLOW",
        })),
        ...(input.denyPermissionIds ?? []).map((permissionId) => ({
          userId: target.id,
          permissionId,
          effect: "DENY",
        })),
      ];
      if (overrides.length)
        await tx.userPermissionOverride.createMany({ data: overrides });
      const user = await tx.user.update({
        where: { id: target.id },
        data: {
          name: input.name.trim(),
          status: input.active ? UserStatus.ACTIVE : UserStatus.BLOCKED,
          forcePasswordChange: input.forcePasswordChange,
          staffNote: input.note?.trim() || null,
        },
      });
      await tx.session.deleteMany({ where: { userId: target.id } });
      await tx.auditLog.create({
        data: {
          userId: input.actorId,
          action: "staff.update",
          entity: "User",
          entityId: target.id,
          metadata: {
            role: role.name,
            active: input.active,
            sessionsRevoked: true,
          },
        },
      });
      return user;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function revokeStaffSessions(input: {
  actorId: string;
  staffId: string;
  sessionId?: string;
}) {
  const result = input.sessionId
    ? await prisma.session.deleteMany({
        where: { id: input.sessionId, userId: input.staffId },
      })
    : await prisma.session.deleteMany({ where: { userId: input.staffId } });
  await prisma.auditLog.create({
    data: {
      userId: input.actorId,
      action: "staff.sessions.revoke",
      entity: "User",
      entityId: input.staffId,
      metadata: {
        sessionId: input.sessionId ? "single" : "all",
        count: result.count,
      },
    },
  });
  return result.count;
}
