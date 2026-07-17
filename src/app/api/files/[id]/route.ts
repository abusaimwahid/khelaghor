import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { currentUser, userPermissions } from "@/server/security";
import { readProtectedUpload } from "@/server/storage";
import { audit } from "@/server/notify";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.fileAsset.findFirst({ where: { id, deletedAt: null } });
  if (!asset) return NextResponse.json({ ok: false, message: "File not found" }, { status: 404 });
  const user = await currentUser();
  const permissions = userPermissions(user);
  const admin = permissions.includes("*") || permissions.includes("orders.view") || permissions.includes("products.update");
  let allowed = admin || Boolean(user && asset.ownerUserId === user.id);
  if (!allowed && asset.visibility === "PUBLIC") allowed = true;
  if (!allowed && asset.visibility === "REVIEW_MODERATED" && asset.relatedResourceType === "Review" && asset.relatedResourceId) {
    const review = await prisma.review.findFirst({ where: { id: asset.relatedResourceId, status: "APPROVED", deletedAt: null }, select: { id: true } });
    allowed = Boolean(review);
  }
  if (!allowed) return NextResponse.json({ ok: false, message: "File not found" }, { status: 404 });
  try {
    const bytes = await readProtectedUpload({ provider: asset.storageProvider, key: asset.storageKey, publicUrl: asset.publicUrl });
    const download = new URL(request.url).searchParams.get("download") === "1";
    if (asset.visibility !== "PUBLIC") await audit({ userId: user?.id, action: "file.download", entity: "FileAsset", entityId: asset.id, metadata: { purpose: asset.purpose } });
    return new NextResponse(bytes, { headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${asset.safeFileName.replace(/["\\]/g, "")}"`,
      "Cache-Control": asset.visibility === "PUBLIC" ? "public, max-age=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    }});
  } catch {
    return NextResponse.json({ ok: false, message: "File not found" }, { status: 404 });
  }
}
