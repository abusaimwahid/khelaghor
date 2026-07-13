"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notify";
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
  const wishlist = await prisma.wishlist.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  const existing = await prisma.wishlistItem.findUnique({ where: { wishlistId_productId: { wishlistId: wishlist.id, productId } } });
  if (existing) await prisma.wishlistItem.delete({ where: { wishlistId_productId: { wishlistId: wishlist.id, productId } } });
  else await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
  revalidatePath("/account/wishlist");
}

export async function createSupportTicketAction(formData: FormData) {
  const user = await requireUser();
  const parsed = supportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/account/support?error=Invalid support ticket");
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      category: parsed.data.category,
      subject: parsed.data.subject,
      messages: { create: { senderId: user.id, body: parsed.data.body } },
    },
  });
  await notifyUser({ userId: user.id, type: "SUPPORT_CREATED", title: "Support ticket created", body: ticket.subject });
  revalidatePath("/account/support");
}

export async function submitReturnAction(formData: FormData) {
  const user = await requireUser();
  const parsed = returnSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/account/returns?error=Invalid return request");
  const item = await prisma.orderItem.findFirst({
    where: { id: parsed.data.orderItemId, order: { userId: user.id, status: { in: ["DELIVERED", "RETURNED"] } } },
  });
  if (!item) redirect("/account/returns?error=Order item is not eligible");
  const request = await prisma.returnRequest.create({
    data: {
      orderId: item.orderId,
      userId: user.id,
      reason: parsed.data.reason,
      description: parsed.data.description,
      items: { create: { orderItemId: item.id, quantity: parsed.data.quantity } },
    },
  });
  await notifyUser({ userId: user.id, type: "RETURN_CREATED", title: "Return request submitted", body: request.reason });
  revalidatePath("/account/returns");
}
