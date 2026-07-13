import { NextResponse } from "next/server";
import { requirePermission } from "@/server/security";
import { saveUpload, type UploadPurpose } from "@/server/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requirePermission("products.update");
  const form = await request.formData();
  const file = form.get("file");
  const purpose = String(form.get("purpose") ?? "product") as UploadPurpose;
  if (!(file instanceof File))
    return NextResponse.json(
      { ok: false, message: "File is required" },
      { status: 400 },
    );
  try {
    const upload = await saveUpload(file, purpose);
    return NextResponse.json({ ok: true, ...upload });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 400 },
    );
  }
}
