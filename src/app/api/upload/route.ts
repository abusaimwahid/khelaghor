import { NextResponse } from "next/server";
import { currentUser, userPermissions } from "@/server/security";
import {
  deleteUpload,
  saveProtectedUpload,
  saveUpload,
  StorageUnavailableError,
  type UploadPurpose,
} from "@/server/storage";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

async function requireUploadPermission(purpose: UploadPurpose) {
  const user = await currentUser();
  const permissions = userPermissions(user);
  if (!user) return false;
  if (["review", "return-evidence", "support-attachment"].includes(purpose))
    return true;
  if (
    !permissions.includes("*") &&
    !permissions.includes("products.update") &&
    !permissions.includes("settings.update")
  ) {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const purpose = String(form.get("purpose") ?? "product") as UploadPurpose;
  if (!(await requireUploadPermission(purpose))) {
    return NextResponse.json(
      { ok: false, message: "Forbidden" },
      { status: 403 },
    );
  }
  if (!(file instanceof File))
    return NextResponse.json(
      { ok: false, message: "File is required" },
      { status: 400 },
    );
  try {
    if (["review", "return-evidence", "support-attachment"].includes(purpose)) {
      const user = await currentUser();
      if (!user)
        return NextResponse.json(
          { ok: false, message: "Forbidden" },
          { status: 403 },
        );
      const stored = await saveProtectedUpload(file, purpose);
      const safeFileName =
        file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "attachment";
      const asset = await prisma.fileAsset.create({
        data: {
          storageProvider: stored.provider,
          storageKey: stored.key,
          publicUrl: stored.publicUrl,
          originalFileName: file.name.slice(0, 255),
          safeFileName,
          mimeType: file.type,
          size: file.size,
          purpose,
          ownerUserId: user.id,
          visibility:
            purpose === "review" ? "REVIEW_MODERATED" : "RESOURCE_PARTICIPANT",
        },
      });
      return NextResponse.json({
        ok: true,
        url: `/api/files/${asset.id}`,
        key: asset.id,
        provider: stored.provider,
        bytes: asset.size,
        mimeType: asset.mimeType,
      });
    }
    const upload = await saveUpload(file, purpose);
    return NextResponse.json({ ok: true, ...upload });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Upload failed",
      },
      { status: error instanceof StorageUnavailableError ? 503 : 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await requireUploadPermission("product"))) {
    return NextResponse.json(
      { ok: false, message: "Forbidden" },
      { status: 403 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as { key?: string };
  if (!body.key) {
    return NextResponse.json(
      { ok: false, message: "Upload key is required" },
      { status: 400 },
    );
  }
  try {
    await deleteUpload(body.key);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Delete failed",
      },
      { status: error instanceof StorageUnavailableError ? 503 : 400 },
    );
  }
}
