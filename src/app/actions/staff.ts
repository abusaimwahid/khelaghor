"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/security";
import { createStaff, revokeStaffSessions, updateStaff } from "@/server/staff";

const text = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();

export async function createStaffAction(form: FormData) {
  const actor = await requirePermission("staff.manage");
  try {
    const user = await createStaff({
      actorId: actor.id,
      name: text(form, "name"),
      email: text(form, "email"),
      roleId: text(form, "roleId"),
      temporaryPassword: text(form, "temporaryPassword"),
      active: form.get("active") === "on",
      forcePasswordChange: form.get("forcePasswordChange") === "on",
      note: text(form, "note"),
      allowPermissionIds: form.getAll("allowPermissionIds").map(String),
      denyPermissionIds: form.getAll("denyPermissionIds").map(String),
    });
    redirect(`/admin/staff/${user.id}?created=1`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
      throw error;
    redirect(
      `/admin/staff/new?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to create staff")}`,
    );
  }
}

export async function updateStaffAction(form: FormData) {
  const actor = await requirePermission("staff.manage");
  const staffId = text(form, "staffId");
  try {
    await updateStaff({
      actorId: actor.id,
      staffId,
      name: text(form, "name"),
      roleId: text(form, "roleId"),
      active: form.get("active") === "on",
      forcePasswordChange: form.get("forcePasswordChange") === "on",
      note: text(form, "note"),
      allowPermissionIds: form.getAll("allowPermissionIds").map(String),
      denyPermissionIds: form.getAll("denyPermissionIds").map(String),
    });
    revalidatePath("/admin/staff");
    redirect(`/admin/staff/${staffId}?saved=1`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
      throw error;
    redirect(
      `/admin/staff/${staffId}/edit?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to update staff")}`,
    );
  }
}

export async function revokeStaffSessionsAction(form: FormData) {
  const actor = await requirePermission("staff.manage");
  const staffId = text(form, "staffId");
  await revokeStaffSessions({
    actorId: actor.id,
    staffId,
    sessionId: text(form, "sessionId") || undefined,
  });
  revalidatePath(`/admin/staff/${staffId}`);
}
