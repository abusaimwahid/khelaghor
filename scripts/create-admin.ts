import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { strongPasswordSchema } from "../src/server/password-policy";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME ?? "KhelaGhor Admin";
  if (
    !email ||
    !password ||
    !strongPasswordSchema.safeParse(password).success
  ) {
    throw new Error(
      "Set ADMIN_BOOTSTRAP_EMAIL and a password with at least 12 characters, uppercase, lowercase, number, and symbol.",
    );
  }
  const permission = await prisma.permission.upsert({
    where: { key: "*" },
    update: {},
    create: { key: "*", description: "Full platform access" },
  });
  const role = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: { name: "Super Admin", description: "Full platform access" },
  });
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: { roleId: role.id, permissionId: permission.id },
    },
    update: {},
    create: { roleId: role.id, permissionId: permission.id },
  });
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash: await bcrypt.hash(password, 12),
      status: "ACTIVE",
      forcePasswordChange: true,
    },
    create: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      status: "ACTIVE",
      forcePasswordChange: true,
      profile: { create: {} },
      wishlist: { create: {} },
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  console.log(
    `Admin bootstrap complete for ${email}. Force a password change after first login.`,
  );
}

main().finally(async () => prisma.$disconnect());
