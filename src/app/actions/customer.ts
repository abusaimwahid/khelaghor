"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ReviewStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notify";
import { assertReviewEligibility } from "@/server/reviews";
import { createReturnRequest } from "@/server/returns";
import { requireUser } from "@/server/security";
import { returnSchema, supportSchema } from "@/server/validation";

export async function saveAddressAction(formData: FormData) {
  const user = await requireUser();
  await prisma.address.create({
    data: {
      userId: user.id,
      label: String(formData.get("label") || "Home"),
      name: String(formData.get("name") || user.name || ""),
      phone: String(formData.get("phone") || user.phone || ""),
      division: String(formData.get("division") || ""),
      district: String(formData.get("district") || ""),
      area: String(formData.get("area") || ""),
      line1: String(formData.get("line1") || ""),
      postalCode: String(formData.get("postalCode") || ""),
      landmark: String(formData.get("landmark") || ""),
    },
  });
  revalidatePath("/account/addresses");
}

export async function toggleWishlistAction(formData: FormData) {
  const user = await requireUser();
  const productId = String(formData.get("productId"));
  const wishlist = await prisma.wishlist.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });
  if (existing)
    await prisma.wishlistItem.delete({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });
  else
    await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId },
    });
  revalidatePath("/account/wishlist");
}

export async function createSupportTicketAction(formData: FormData) {
  const user = await requireUser();
  const parsed = supportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect("/account/support?error=Invalid support ticket");
  const ticket = await prisma.supportTicket.create({
    data: {
      number: `SUP-${Date.now().toString(36).toUpperCase()}`,
      userId: user.id,
      category: parsed.data.category,
      priority: parsed.data.priority || "NORMAL",
      subject: parsed.data.subject,
      messages: { create: { senderId: user.id, body: parsed.data.body } },
      attachments: {
        create: parsed.data.attachmentUrls.map((url) => ({
          uploaderId: user.id,
          url,
          fileName: url.split("/").pop() || "attachment",
          mimeType: url.toLowerCase().endsWith(".pdf")
            ? "application/pdf"
            : "image/*",
          size: 0,
        })),
      },
    },
  });
  await notifyUser({
    userId: user.id,
    type: "SUPPORT_CREATED",
    title: "Support ticket created",
    body: ticket.subject,
  });
  await prisma.notification.create({
    data: {
      type: "ADMIN_SUPPORT_TICKET",
      title: "New support ticket",
      body: ticket.subject,
      resourceType: "SupportTicket",
      resourceId: ticket.id,
      href: `/admin/support/${ticket.id}`,
    },
  });
  revalidatePath("/account/support");
}

export async function replySupportTicketAction(formData: FormData) {
  const user = await requireUser();
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 2)
    redirect(`/account/support/${ticketId}?error=Reply is required`);
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId: user.id },
  });
  if (!ticket) redirect("/account/support?error=Ticket not found");
  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: ticket.status === "RESOLVED" ? "OPEN" : ticket.status,
      messages: { create: { senderId: user.id, body, public: true } },
    },
  });
  await prisma.notification.create({
    data: {
      type: "ADMIN_SUPPORT_REPLY",
      title: "Customer replied",
      body: ticket.subject,
      resourceType: "SupportTicket",
      resourceId: ticket.id,
      href: `/admin/support/${ticket.id}`,
    },
  });
  revalidatePath(`/account/support/${ticket.id}`);
}

export async function submitReturnAction(formData: FormData) {
  const user = await requireUser();
  const parsed = returnSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect("/account/returns?error=Invalid return request");
  await createReturnRequest({
    userId: user.id,
    orderItemId: parsed.data.orderItemId,
    quantity: parsed.data.quantity,
    reason: parsed.data.reason,
    description: parsed.data.description,
    resolution: parsed.data.resolution,
    evidenceUrls: parsed.data.evidenceUrls,
  });
  revalidatePath("/account/returns");
}

export async function saveReviewAction(formData: FormData) {
  const user = await requireUser();
  const reviewId = String(formData.get("reviewId") ?? "");
  const orderItemId = String(formData.get("orderItemId") ?? "");
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const imageUrls = formData
    .getAll("imageUrls")
    .map(String)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 10)
    redirect("/account/reviews?error=Invalid review");
  const item = await assertReviewEligibility({
    userId: user.id,
    orderItemId,
    reviewId: reviewId || undefined,
  });
  const review = await prisma.$transaction(async (tx) => {
    const ownedReview = reviewId
      ? await tx.review.findFirst({ where: { id: reviewId, userId: user.id } })
      : null;
    const saved = reviewId
      ? await tx.review.update({
          where: { id: ownedReview?.id ?? "__missing__" },
          data: {
            rating,
            title: title || null,
            text,
            status: ReviewStatus.PENDING,
            hiddenAt: null,
            suspicious: false,
          },
        })
      : await tx.review.create({
          data: {
            userId: user.id,
            productId: item.productId,
            orderItemId: item.id,
            rating,
            title: title || null,
            text,
            verifiedPurchase: true,
          },
        });
    await tx.reviewImage.deleteMany({ where: { reviewId: saved.id } });
    if (imageUrls.length)
      await tx.reviewImage.createMany({
        data: imageUrls.map((url) => ({ reviewId: saved.id, url })),
      });
    return saved;
  });
  await prisma.notification.create({
    data: {
      type: "ADMIN_REVIEW_PENDING",
      title: "Review awaiting moderation",
      body: `${user.email} submitted a review.`,
      resourceType: "Review",
      resourceId: review.id,
      href: `/admin/reviews/${review.id}`,
    },
  });
  revalidatePath("/account/reviews");
  redirect("/account/reviews?saved=1");
}

export async function deleteReviewAction(formData: FormData) {
  const user = await requireUser();
  const reviewId = String(formData.get("reviewId") ?? "");
  await prisma.review.updateMany({
    where: { id: reviewId, userId: user.id },
    data: { deletedAt: new Date(), status: ReviewStatus.HIDDEN },
  });
  revalidatePath("/account/reviews");
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const notificationId = String(formData.get("notificationId") ?? "");
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/account/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/account/notifications");
}
