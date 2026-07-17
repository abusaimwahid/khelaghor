import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

const SESSION_COOKIE = "kg_session";
const GUEST_CART_COOKIE = "kg_guest_cart";
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function assertRateLimit(scope: string, limit = 10) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (bucket.count >= limit)
    throw new Error("Too many requests. Please wait a minute and try again.");
  bucket.count += 1;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.session.create({
    data: { userId, sessionToken: token, expires },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token)
    await prisma.session.deleteMany({ where: { sessionToken: token } });
  cookieStore.delete(SESSION_COOKIE);
}

export async function currentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: {
                include: { permissions: { include: { permission: true } } },
              },
            },
          },
          permissionOverrides: { include: { permission: true } },
        },
      },
    },
  });
  if (
    !session ||
    session.expires < new Date() ||
    session.user.status !== "ACTIVE"
  )
    return null;
  return session.user;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/account")}`);
  return user;
}

export function userPermissions(user: Awaited<ReturnType<typeof currentUser>>) {
  const inherited = new Set(
    user?.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.key),
    ) ?? [],
  );
  for (const override of user?.permissionOverrides ?? []) {
    if (override.effect === "DENY") inherited.delete(override.permission.key);
    else inherited.add(override.permission.key);
  }
  return [...inherited];
}

export async function requirePermission(permission: string) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/admin")}`);
  const permissions = userPermissions(user);
  if (!permissions.includes("*") && !permissions.includes(permission))
    redirect(`/forbidden?area=${encodeURIComponent("admin")}`);
  return user;
}

function guestCookieOptions(maxAge = 60 * 60 * 24 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  };
}

export async function readGuestCartToken() {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_CART_COOKIE)?.value ?? null;
}

export async function ensureGuestCartTokenInAction() {
  const cookieStore = await cookies();
  let token = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!token) {
    token = crypto.randomBytes(18).toString("base64url");
    cookieStore.set(GUEST_CART_COOKIE, token, guestCookieOptions());
  }
  return token;
}

export async function clearGuestCartTokenInAction() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_CART_COOKIE);
}
