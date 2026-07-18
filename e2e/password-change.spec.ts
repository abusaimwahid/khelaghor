import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../src/server/db";

const email = `password-flow-${crypto.randomUUID()}@example.test`;
const temporaryPassword = `Aa1!${crypto.randomUUID()}`;
const privatePassword = `Bb2@${crypto.randomUUID()}`;
let userId: string;

test.beforeAll(async () => {
  const role = await prisma.role.findUniqueOrThrow({
    where: { name: "Super Admin" },
  });
  const user = await prisma.user.create({
    data: {
      email,
      name: "Password Flow Admin",
      passwordHash: await bcrypt.hash(temporaryPassword, 4),
      forcePasswordChange: true,
      roles: { create: { roleId: role.id } },
    },
  });
  userId = user.id;
});

test.afterAll(async () => {
  if (userId) await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

test("forced admin password change rotates the session and credentials", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password/i).fill(temporaryPassword);
  await page.getByRole("button", { name: /^login$/i }).click();

  await expect(page).toHaveURL(/\/account\/security\?required=1/);
  await expect(page.getByText("Minimum 12 characters")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /show current password/i }),
  ).toBeVisible();

  await page.locator('input[name="currentPassword"]').fill(temporaryPassword);
  await page.locator('input[name="newPassword"]').fill(privatePassword);
  await page.locator('input[name="confirmPassword"]').fill(privatePassword);
  await page.getByRole("button", { name: /update password/i }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: /operations dashboard/i }),
  ).toBeVisible();
  const updated = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });
  expect(updated.forcePasswordChange).toBe(false);
  expect(await prisma.session.count({ where: { userId } })).toBe(1);
  expect(await bcrypt.compare(temporaryPassword, updated.passwordHash!)).toBe(
    false,
  );
  expect(await bcrypt.compare(privatePassword, updated.passwordHash!)).toBe(
    true,
  );

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password/i).fill(temporaryPassword);
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(page).toHaveURL(/\/login\?error=/);

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password/i).fill(privatePassword);
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
});
