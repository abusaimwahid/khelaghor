"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { adjustInventory } from "@/server/inventory";
import { audit } from "@/server/notify";
import { requirePermission } from "@/server/security";
import { brandSchema, categorySchema, productSchema } from "@/server/validation";

export async function saveProductAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/products?error=Invalid product details");
  const productId = String(formData.get("productId") ?? "");
  const data = parsed.data;
  const product = await prisma.product.upsert({
    where: { id: productId || "__new__" },
    create: {
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      brandId: data.brandId || null,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice === "" ? null : data.salePrice,
      stock: data.stock,
      status: data.status,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      categories: { create: { categoryId: data.categoryId } },
      images: data.imageUrl ? { create: { url: data.imageUrl, alt: data.name } } : undefined,
      inventory: { create: { available: data.stock } },
    },
    update: {
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      brandId: data.brandId || null,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice === "" ? null : data.salePrice,
      stock: data.stock,
      status: data.status,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      categories: { deleteMany: {}, create: { categoryId: data.categoryId } },
    },
  });
  await prisma.inventory.upsert({ where: { productId: product.id }, create: { productId: product.id, available: data.stock }, update: { available: data.stock } });
  if (data.variantSku) {
    await prisma.productVariant.upsert({
      where: { sku: data.variantSku },
      create: { productId: product.id, sku: data.variantSku, size: data.variantSize, colour: data.variantColour, stock: data.variantStock ?? 0 },
      update: { size: data.variantSize, colour: data.variantColour, stock: data.variantStock ?? 0 },
    });
  }
  await audit({ userId: admin.id, action: productId ? "product.update" : "product.create", entity: "Product", entityId: product.id });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function archiveProductAction(formData: FormData) {
  const admin = await requirePermission("products.delete");
  const id = String(formData.get("productId"));
  await prisma.product.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() } });
  await audit({ userId: admin.id, action: "product.archive", entity: "Product", entityId: id });
  revalidatePath("/admin/products");
}

export async function saveCategoryAction(formData: FormData) {
  await requirePermission("products.update");
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/categories?error=Invalid category");
  const id = String(formData.get("categoryId") ?? "");
  await prisma.category.upsert({
    where: { id: id || "__new__" },
    create: { ...parsed.data, parentId: parsed.data.parentId || null },
    update: { ...parsed.data, parentId: parsed.data.parentId || null },
  });
  revalidatePath("/admin/categories");
}

export async function saveBrandAction(formData: FormData) {
  await requirePermission("products.update");
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/brands?error=Invalid brand");
  const id = String(formData.get("brandId") ?? "");
  await prisma.brand.upsert({
    where: { id: id || "__new__" },
    create: parsed.data,
    update: parsed.data,
  });
  revalidatePath("/admin/brands");
}

export async function adjustInventoryAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  await adjustInventory({
    productId: String(formData.get("productId")),
    variantId: String(formData.get("variantId") || "") || undefined,
    difference: Number(formData.get("difference")),
    reason: String(formData.get("reason") || "Manual adjustment"),
    adminUserId: admin.id,
    notes: String(formData.get("notes") || ""),
  });
  revalidatePath("/admin/inventory");
}

export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requirePermission("orders.update");
  const orderId = String(formData.get("orderId"));
  const toStatus = String(formData.get("status")) as OrderStatus;
  const note = String(formData.get("note") || "");
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: toStatus,
      statusHistory: { create: { fromStatus: order.status, toStatus, note, actorId: admin.id } },
    },
  });
  await audit({ userId: admin.id, action: "order.status", entity: "Order", entityId: orderId, metadata: { toStatus } });
  revalidatePath("/admin/orders");
}
