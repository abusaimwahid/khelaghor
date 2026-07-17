"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { audit } from "@/server/notify";
export async function saveLegalReviewAction(form: FormData) {
  const actor = await requirePermission("settings.update");
  const policy = String(form.get("policy") ?? "");
  const status = String(form.get("status") ?? "REQUIRES_REVIEW");
  if (!policy || !["REQUIRES_REVIEW", "IN_REVIEW", "REVIEWED"].includes(status))
    throw new Error("Invalid policy review metadata.");
  await prisma.legalPolicyReview.upsert({
    where: { policy },
    update: {
      version: String(form.get("version") ?? "") || null,
      effectiveDate: form.get("effectiveDate")
        ? new Date(String(form.get("effectiveDate")))
        : null,
      reviewedBy: String(form.get("reviewedBy") ?? "") || null,
      reviewDate: form.get("reviewDate")
        ? new Date(String(form.get("reviewDate")))
        : null,
      status,
      notes: String(form.get("notes") ?? "") || null,
    },
    create: {
      policy,
      version: String(form.get("version") ?? "") || null,
      effectiveDate: form.get("effectiveDate")
        ? new Date(String(form.get("effectiveDate")))
        : null,
      reviewedBy: String(form.get("reviewedBy") ?? "") || null,
      reviewDate: form.get("reviewDate")
        ? new Date(String(form.get("reviewDate")))
        : null,
      status,
      notes: String(form.get("notes") ?? "") || null,
    },
  });
  await audit({
    userId: actor.id,
    action: "legal-review.update",
    entity: "LegalPolicyReview",
    entityId: policy,
    metadata: { status },
  });
  revalidatePath("/admin/legal-review");
}
