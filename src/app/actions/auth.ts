"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import {
  assertRateLimit,
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/server/security";
import {
  loginSchema,
  passwordChangeSchema,
  registerSchema,
} from "@/server/validation";
import { mergeGuestCart } from "@/server/cart";
import { audit } from "@/server/notify";
import { requireUser } from "@/server/security";

export async function registerAction(formData: FormData) {
  await assertRateLimit("register", 5);
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/register?error=Invalid registration details");
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) redirect("/register?error=Email already registered");
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
      profile: { create: {} },
      wishlist: { create: {} },
    },
  });
  await createSession(user.id);
  await mergeGuestCart(user.id);
  await audit({
    userId: user.id,
    action: "register",
    entity: "User",
    entityId: user.id,
  });
  redirect("/account");
}

export async function loginAction(formData: FormData) {
  await assertRateLimit("login", 8);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=Invalid login details");
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { roles: true },
  });
  if (
    !user?.passwordHash ||
    !(await verifyPassword(parsed.data.password, user.passwordHash))
  )
    redirect("/login?error=Invalid email or password");
  await createSession(user.id);
  await mergeGuestCart(user.id);
  await audit({
    userId: user.id,
    action: "login",
    entity: "User",
    entityId: user.id,
  });
  if (user.forcePasswordChange) redirect("/account/security?required=1");
  redirect(user.roles.length ? "/admin" : "/account");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function changePasswordAction(formData: FormData) {
  await assertRateLimit("change-password", 5);
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (
    !parsed.success ||
    !user.passwordHash ||
    !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))
  ) {
    redirect("/account/security?error=Invalid password details");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      forcePasswordChange: false,
    },
  });
  await audit({
    userId: user.id,
    action: "password.change",
    entity: "User",
    entityId: user.id,
  });
  redirect(user.roles.length ? "/admin" : "/account");
}
