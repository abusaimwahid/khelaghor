"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DiscountType,
  OrderStatus,
  ProductStatus,
  ReviewStatus,
} from "@prisma/client";
import { prisma } from "@/server/db";
import {
  adjustInventory,
  inventoryMovementTypes,
  type InventoryMovementType,
} from "@/server/inventory";
import { audit, notifyUser } from "@/server/notify";
import { requirePermission } from "@/server/security";
import {
  defaultHomepageSettings,
  defaultSiteSettings,
  saveHomepageSettings,
  saveSiteSettings,
  type HomeSectionSettings,
  type HeroSlideSettings,
  type HomepageSettings,
  type ProductSectionSettings,
  type PromoCardSettings,
  type SiteSettings,
} from "@/server/site-settings";
import { validateBangladeshAddress } from "@/data/bangladesh-locations";
import { normalizeCouponCode } from "@/server/coupons";
import {
  brandSchema,
  categorySchema,
  productSchema,
} from "@/server/validation";

export async function saveProductAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const parsed = productSchema.safeParse({
    ...Object.fromEntries(formData),
    categoryIds: formData.getAll("categoryIds").map(String).filter(Boolean),
  });
  if (!parsed.success)
    redirect(
      `/admin/products${String(formData.get("productId") ?? "") ? `/${String(formData.get("productId"))}/edit` : "/new"}?error=Invalid product details`,
    );
  const productId = String(formData.get("productId") ?? "");
  const data = parsed.data;
  const categoryIds = data.categoryIds?.length
    ? data.categoryIds
    : data.categoryId
      ? [data.categoryId]
      : [];
  if (!categoryIds.length) {
    redirect(
      `/admin/products${productId ? `/${productId}/edit` : "/new"}?error=Select at least one category`,
    );
  }
  const imageRows = collectImageRows(formData, data.name);
  const variantRows = collectVariantRows(formData);
  const product = await prisma.$transaction(async (tx) => {
    const previous = productId
      ? await tx.product.findUnique({
          where: { id: productId },
          include: { images: true, variants: true, categories: true },
        })
      : null;
    const productData = {
      name: data.name,
      nameBn: data.nameBn || null,
      slug: data.slug,
      sku: data.sku,
      barcode: data.barcode || null,
      productType: data.productType || null,
      tags: data.tags || null,
      shortDescription: data.shortDescription,
      shortDescriptionBn: data.shortDescriptionBn || null,
      fullDescription: data.fullDescription,
      fullDescriptionBn: data.fullDescriptionBn || null,
      safetyInfo: data.safetyInfo || null,
      careInstructions: data.careInstructions || null,
      warranty: data.warranty || null,
      returnEligible: Boolean(data.returnEligible),
      specifications: data.specifications
        ? { text: data.specifications }
        : undefined,
      costPrice: data.costPrice ?? null,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice ?? null,
      saleStartsAt: data.saleStartsAt ?? null,
      saleEndsAt: data.saleEndsAt ?? null,
      taxable: Boolean(data.taxable),
      tax: data.tax ?? null,
      trackStock: data.trackStock !== false,
      stock: data.stock,
      reservedStock: data.reservedStock,
      lowStockThreshold: data.lowStockThreshold,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity ?? null,
      allowBackorder: Boolean(data.allowBackorder),
      stockStatus: data.stockStatus || "IN_STOCK",
      ageGroup: data.ageGroup || null,
      gender: data.gender || null,
      weight: data.weight ?? null,
      length: data.length ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      dimensions: [data.length, data.width, data.height].some(
        (value) => value !== undefined,
      )
        ? `${data.length ?? 0} x ${data.width ?? 0} x ${data.height ?? 0}`
        : null,
      deliveryClass: data.deliveryClass || null,
      status: data.status,
      featured: Boolean(data.featured),
      newArrival: Boolean(data.newArrival),
      bestSeller: Boolean(data.bestSeller),
      flashSale: Boolean(data.flashSale),
      preOrder: Boolean(data.preOrder),
      active: data.active !== false,
      publishedAt:
        data.status === ProductStatus.PUBLISHED
          ? (data.publishedAt ?? previous?.publishedAt ?? new Date())
          : data.publishedAt,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      searchKeywords: data.searchKeywords || null,
      canonicalUrl: data.canonicalUrl || null,
      socialImage: data.socialImage || null,
      archivedAt:
        data.status === ProductStatus.ARCHIVED
          ? (previous?.archivedAt ?? new Date())
          : null,
    };
    const saved = productId
      ? await tx.product.update({
          where: { id: productId },
          data: {
            ...productData,
            brand: data.brandId
              ? { connect: { id: data.brandId } }
              : { disconnect: true },
          },
        })
      : await tx.product.create({
          data: {
            ...productData,
            ...(data.brandId
              ? { brand: { connect: { id: data.brandId } } }
              : {}),
            inventory: {
              create: {
                available: data.stock,
                reserved: data.reservedStock,
              },
            },
          },
        });
    await tx.productCategory.deleteMany({ where: { productId: saved.id } });
    await tx.productCategory.createMany({
      data: categoryIds.map((categoryId) => ({
        productId: saved.id,
        categoryId,
      })),
      skipDuplicates: true,
    });
    await tx.inventory.upsert({
      where: { productId: saved.id },
      create: {
        productId: saved.id,
        available: data.stock,
        reserved: data.reservedStock,
      },
      update: {
        available: data.stock,
        reserved: data.reservedStock,
      },
    });
    await tx.productImage.deleteMany({ where: { productId: saved.id } });
    if (imageRows.length) {
      await tx.productImage.createMany({
        data: imageRows.map((image, index) => ({
          productId: saved.id,
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder ?? index,
          variantKey: image.variantKey || null,
        })),
      });
    }
    await tx.productVariant.deleteMany({
      where: {
        productId: saved.id,
        id: { notIn: variantRows.flatMap((variant) => variant.id ?? []) },
      },
    });
    const combinations = new Set<string>();
    for (const variant of variantRows) {
      const combo = [
        variant.size,
        variant.colour,
        variant.material,
        variant.style,
      ]
        .map((value) => value?.trim().toLowerCase() ?? "")
        .join("|");
      if (combinations.has(combo))
        throw new Error("Duplicate variant attributes.");
      combinations.add(combo);
      const variantData = {
        name: variant.name || null,
        sku: variant.sku,
        barcode: variant.barcode || null,
        size: variant.size || null,
        colour: variant.colour || null,
        material: variant.material || null,
        style: variant.style || null,
        priceOverride: variant.priceOverride ?? null,
        salePriceOverride: variant.salePriceOverride ?? null,
        costPriceOverride: variant.costPriceOverride ?? null,
        stock: variant.stock,
        reservedStock: variant.reservedStock,
        lowStockThreshold: variant.lowStockThreshold,
        weightOverride: variant.weightOverride ?? null,
        image: variant.image || null,
        active: variant.active,
        status: variant.active ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
        sortOrder: variant.sortOrder,
      };
      if (variant.id) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: variantData,
        });
      } else {
        await tx.productVariant.create({
          data: { ...variantData, productId: saved.id },
        });
      }
    }
    return saved;
  });
  await audit({
    userId: admin.id,
    action: productId ? "product.update" : "product.create",
    entity: "Product",
    entityId: product.id,
    metadata: {
      status: data.status,
      imageCount: imageRows.length,
      variantCount: variantRows.length,
    },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${product.slug}`);
  redirect(`/admin/products/${product.id}/edit?saved=1`);
}

function collectImageRows(formData: FormData, fallbackAlt: string) {
  const urls = formData.getAll("imageUrl").map(String);
  const alts = formData.getAll("imageAlt").map(String);
  const sortOrders = formData.getAll("imageSortOrder").map(Number);
  const variantKeys = formData.getAll("imageVariantKey").map(String);
  return urls
    .map((url, index) => ({
      url: url.trim(),
      alt: alts[index]?.trim() || fallbackAlt,
      sortOrder: Number.isFinite(sortOrders[index]) ? sortOrders[index] : index,
      variantKey: variantKeys[index]?.trim() || "",
    }))
    .filter((image) => image.url);
}

function nullableNumber(value: FormDataEntryValue | null) {
  if (value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function collectVariantRows(formData: FormData) {
  const ids = formData.getAll("variantId").map(String);
  const skus = formData.getAll("variantSku").map(String);
  const names = formData.getAll("variantName").map(String);
  const barcodes = formData.getAll("variantBarcode").map(String);
  const sizes = formData.getAll("variantSize").map(String);
  const colours = formData.getAll("variantColour").map(String);
  const materials = formData.getAll("variantMaterial").map(String);
  const styles = formData.getAll("variantStyle").map(String);
  const priceOverrides = formData.getAll("variantPriceOverride");
  const salePriceOverrides = formData.getAll("variantSalePriceOverride");
  const costPriceOverrides = formData.getAll("variantCostPriceOverride");
  const stocks = formData.getAll("variantStock").map(Number);
  const reservedStocks = formData.getAll("variantReservedStock").map(Number);
  const lowStockThresholds = formData
    .getAll("variantLowStockThreshold")
    .map(Number);
  const weightOverrides = formData.getAll("variantWeightOverride");
  const images = formData.getAll("variantImage").map(String);
  const activeValues = formData.getAll("variantActive").map(String);
  return skus
    .map((sku, index) => ({
      id: ids[index] || undefined,
      sku: sku.trim(),
      name: names[index]?.trim() || "",
      barcode: barcodes[index]?.trim() || "",
      size: sizes[index]?.trim() || "",
      colour: colours[index]?.trim() || "",
      material: materials[index]?.trim() || "",
      style: styles[index]?.trim() || "",
      priceOverride: nullableNumber(priceOverrides[index]),
      salePriceOverride: nullableNumber(salePriceOverrides[index]),
      costPriceOverride: nullableNumber(costPriceOverrides[index]),
      stock: Number.isFinite(stocks[index]) ? stocks[index] : 0,
      reservedStock: Number.isFinite(reservedStocks[index])
        ? reservedStocks[index]
        : 0,
      lowStockThreshold: Number.isFinite(lowStockThresholds[index])
        ? lowStockThresholds[index]
        : 5,
      weightOverride: nullableNumber(weightOverrides[index]),
      image: images[index]?.trim() || "",
      active: activeValues[index] !== "false",
      sortOrder: index,
    }))
    .filter((variant) => variant.sku);
}

export async function bulkProductAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const action = String(formData.get("bulkAction"));
  const ids = formData.getAll("productId").map(String).filter(Boolean);
  if (!ids.length) redirect("/admin/products?error=Select products first");
  let data: Record<string, unknown>;
  const auditAction = `product.bulk.${action}`;
  if (action === "publish") {
    data = {
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      active: true,
      archivedAt: null,
    };
  } else if (action === "unpublish") {
    data = { status: ProductStatus.DRAFT };
  } else if (action === "feature") {
    data = { featured: true };
  } else if (action === "unfeature") {
    data = { featured: false };
  } else if (action === "archive") {
    data = {
      status: ProductStatus.ARCHIVED,
      archivedAt: new Date(),
      active: false,
    };
  } else if (action === "delete") {
    await requirePermission("products.delete");
    const attachedOrders = await prisma.orderItem.count({
      where: { productId: { in: ids } },
    });
    if (attachedOrders > 0) {
      redirect(
        "/admin/products?error=Products with orders cannot be deleted. Archive them instead.",
      );
    }
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    await audit({
      userId: admin.id,
      action: auditAction,
      entity: "Product",
      metadata: { ids },
    });
    revalidatePath("/admin/products");
    redirect("/admin/products?success=Products deleted");
  } else {
    redirect("/admin/products?error=Invalid bulk action");
  }
  await audit({
    userId: admin.id,
    action: auditAction,
    entity: "Product",
    metadata: { ids },
  });
  await prisma.product.updateMany({ where: { id: { in: ids } }, data });
  revalidatePath("/admin/products");
  redirect("/admin/products?success=Bulk action applied");
}

export async function archiveProductAction(formData: FormData) {
  const admin = await requirePermission("products.delete");
  const id = String(formData.get("productId"));
  await prisma.product.update({
    where: { id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  await audit({
    userId: admin.id,
    action: "product.archive",
    entity: "Product",
    entityId: id,
  });
  revalidatePath("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  const admin = await requirePermission("products.delete");
  const id = String(formData.get("productId"));
  const orderItems = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItems > 0) {
    redirect(
      `/admin/products/${id}/edit?error=Products with orders cannot be deleted. Archive instead.`,
    );
  }
  await prisma.product.delete({ where: { id } });
  await audit({
    userId: admin.id,
    action: "product.delete",
    entity: "Product",
    entityId: id,
  });
  revalidatePath("/admin/products");
  redirect("/admin/products?success=Product deleted");
}

export async function saveCategoryAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/categories?error=Invalid category");
  const id = String(formData.get("categoryId") ?? "");
  const parentId = parsed.data.parentId || null;
  if (id && parentId === id) {
    redirect(
      `/admin/categories/${id}/edit?error=Category cannot be its own parent`,
    );
  }
  if (id && parentId && (await isCategoryDescendant(parentId, id))) {
    redirect(
      `/admin/categories/${id}/edit?error=Category hierarchy cannot be circular`,
    );
  }
  const duplicate = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, id: id ? { not: id } : undefined },
    select: { id: true },
  });
  if (duplicate) {
    redirect(
      `/admin/categories${id ? `/${id}/edit` : "/new"}?error=Category slug already exists`,
    );
  }
  const data = {
    name: parsed.data.name,
    nameBn: parsed.data.nameBn || null,
    slug: parsed.data.slug,
    parentId,
    description: parsed.data.description || null,
    descriptionBn: parsed.data.descriptionBn || null,
    image: parsed.data.image || null,
    icon: parsed.data.icon || null,
    sortOrder: parsed.data.sortOrder,
    active: parsed.data.active !== false,
    featured: Boolean(parsed.data.featured),
    seoTitle: parsed.data.seoTitle || null,
    seoDescription: parsed.data.seoDescription || null,
  };
  const category = id
    ? await prisma.category.update({ where: { id }, data })
    : await prisma.category.create({ data });
  await audit({
    userId: admin.id,
    action: id ? "category.update" : "category.create",
    entity: "Category",
    entityId: category.id,
    metadata: { slug: category.slug, parentId: category.parentId },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath(`/categories/${category.slug}`);
  redirect(`/admin/categories/${category.id}/edit?saved=1`);
}

export async function saveBrandAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/brands?error=Invalid brand");
  const id = String(formData.get("brandId") ?? "");
  const duplicate = await prisma.brand.findFirst({
    where: { slug: parsed.data.slug, id: id ? { not: id } : undefined },
    select: { id: true },
  });
  if (duplicate) {
    redirect(
      `/admin/brands${id ? `/${id}/edit` : "/new"}?error=Brand slug already exists`,
    );
  }
  const data = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    logo: parsed.data.logo || null,
    description: parsed.data.description || null,
    descriptionBn: parsed.data.descriptionBn || null,
    website: parsed.data.website || null,
    country: parsed.data.country || null,
    active: parsed.data.active !== false,
    featured: Boolean(parsed.data.featured),
    seoTitle: parsed.data.seoTitle || null,
    seoDescription: parsed.data.seoDescription || null,
    archivedAt: parsed.data.active === false ? new Date() : null,
  };
  const brand = id
    ? await prisma.brand.update({ where: { id }, data })
    : await prisma.brand.create({ data });
  await audit({
    userId: admin.id,
    action: id ? "brand.update" : "brand.create",
    entity: "Brand",
    entityId: brand.id,
    metadata: { slug: brand.slug, active: brand.active },
  });
  revalidatePath("/admin/brands");
  revalidatePath("/brands");
  redirect(`/admin/brands/${brand.id}/edit?saved=1`);
}

export async function adjustInventoryAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const movementTypeValue = formString(formData, "movementType");
  const movementType = inventoryMovementTypes.includes(
    movementTypeValue as InventoryMovementType,
  )
    ? (movementTypeValue as InventoryMovementType)
    : "CORRECTION";
  await adjustInventory({
    productId: String(formData.get("productId")),
    variantId: String(formData.get("variantId") || "") || undefined,
    difference: Number(formData.get("difference")),
    reservedDifference: Number(formData.get("reservedDifference") || 0),
    movementType,
    reason: String(formData.get("reason") || "Manual adjustment"),
    reference: formString(formData, "reference"),
    idempotencyKey:
      formString(formData, "idempotencyKey") ||
      `admin-${admin.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    adminUserId: admin.id,
    notes: String(formData.get("notes") || ""),
  });
  await audit({
    userId: admin.id,
    action: "inventory.adjust",
    entity: "Inventory",
    entityId: String(formData.get("productId")),
    metadata: {
      variantId: String(formData.get("variantId") || "") || null,
      movementType,
      difference: Number(formData.get("difference")),
    },
  });
  revalidatePath("/admin/inventory");
}

export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requirePermission("orders.update");
  const orderId = String(formData.get("orderId"));
  const toStatus = String(formData.get("status")) as OrderStatus;
  const note = String(formData.get("note") || "");
  await transitionOrderStatus(orderId, toStatus, admin.id, note);
  await audit({
    userId: admin.id,
    action: "order.status",
    entity: "Order",
    entityId: orderId,
    metadata: { toStatus },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function archiveCategoryAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const id = String(formData.get("categoryId"));
  const category = await prisma.category.update({
    where: { id },
    data: { active: false, archivedAt: new Date() },
  });
  await audit({
    userId: admin.id,
    action: "category.archive",
    entity: "Category",
    entityId: id,
  });
  revalidatePath("/admin/categories");
  revalidatePath(`/categories/${category.slug}`);
}

export async function moveCategoryAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const id = String(formData.get("categoryId"));
  const direction = String(formData.get("direction")) === "down" ? 1 : -1;
  const category = await prisma.category.update({
    where: { id },
    data: { sortOrder: { increment: direction } },
  });
  await audit({
    userId: admin.id,
    action: "category.reorder",
    entity: "Category",
    entityId: id,
    metadata: { sortOrder: category.sortOrder },
  });
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const admin = await requirePermission("products.delete");
  const id = String(formData.get("categoryId"));
  const [children, products] = await Promise.all([
    prisma.category.count({ where: { parentId: id, archivedAt: null } }),
    prisma.productCategory.count({ where: { categoryId: id } }),
  ]);
  if (children > 0 || products > 0) {
    redirect(
      `/admin/categories/${id}/edit?error=Archive instead. Categories with children or products cannot be deleted.`,
    );
  }
  await prisma.category.delete({ where: { id } });
  await audit({
    userId: admin.id,
    action: "category.delete",
    entity: "Category",
    entityId: id,
  });
  revalidatePath("/admin/categories");
  redirect("/admin/categories?deleted=1");
}

export async function archiveBrandAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const id = String(formData.get("brandId"));
  await prisma.brand.update({
    where: { id },
    data: { active: false, archivedAt: new Date() },
  });
  await audit({
    userId: admin.id,
    action: "brand.archive",
    entity: "Brand",
    entityId: id,
  });
  revalidatePath("/admin/brands");
  revalidatePath("/brands");
}

export async function moveBrandAction(formData: FormData) {
  const admin = await requirePermission("products.update");
  const id = String(formData.get("brandId"));
  const direction = String(formData.get("direction")) === "down" ? 1 : -1;
  const brand = await prisma.brand.update({
    where: { id },
    data: { featured: true },
  });
  await audit({
    userId: admin.id,
    action: "brand.reorder",
    entity: "Brand",
    entityId: id,
    metadata: { direction, featured: brand.featured },
  });
  revalidatePath("/admin/brands");
}

export async function deleteBrandAction(formData: FormData) {
  const admin = await requirePermission("products.delete");
  const id = String(formData.get("brandId"));
  const products = await prisma.product.count({ where: { brandId: id } });
  if (products > 0) {
    redirect(
      `/admin/brands/${id}/edit?error=Archive instead. Brands assigned to products cannot be deleted.`,
    );
  }
  await prisma.brand.delete({ where: { id } });
  await audit({
    userId: admin.id,
    action: "brand.delete",
    entity: "Brand",
    entityId: id,
  });
  revalidatePath("/admin/brands");
  redirect("/admin/brands?deleted=1");
}

export async function saveOrderNoteAction(formData: FormData) {
  const admin = await requirePermission("orders.update");
  const orderId = String(formData.get("orderId"));
  await prisma.order.update({
    where: { id: orderId },
    data: {
      internalNotes: formString(formData, "internalNotes"),
      deliveryNote: formString(formData, "deliveryNote"),
      courierProvider: formString(formData, "courierProvider") || null,
      courierOrderId: formString(formData, "courierOrderId") || null,
      trackingId: formString(formData, "trackingId") || null,
    },
  });
  await audit({
    userId: admin.id,
    action: "order.notes",
    entity: "Order",
    entityId: orderId,
  });
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function saveDeliveryZoneAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const zoneId = formString(formData, "zoneId");
  const slug = formString(formData, "slug");
  const ruleDivisionIds = arrayValues(formData, "rule.divisionId");
  const ruleDistrictIds = arrayValues(formData, "rule.districtId");
  const ruleAreaIds = arrayValues(formData, "rule.areaId");
  const rulePriorities = arrayValues(formData, "rule.priority");
  const remoteOnly = checkboxValues(formData, "rule.remoteOnly");
  const rules = ruleDivisionIds
    .map((divisionId, index) => ({
      divisionId,
      districtId: ruleDistrictIds[index] || null,
      areaId: ruleAreaIds[index] || null,
      priority: Number(rulePriorities[index] ?? 0),
      remoteOnly: remoteOnly.has(String(index)) || null,
    }))
    .filter((rule) => rule.divisionId || rule.remoteOnly);
  const ruleKeys = new Set<string>();
  for (const [index, rule] of rules.entries()) {
    if (rule.divisionId && rule.districtId) {
      const validated = validateBangladeshAddress({
        divisionId: rule.divisionId,
        districtId: rule.districtId,
        areaId: rule.areaId || undefined,
      });
      if (!validated.ok) {
        redirect(
          `/admin/delivery-zones${zoneId ? `/${zoneId}/edit` : "/new"}?error=${encodeURIComponent(validated.message)}`,
        );
      }
    }
    const key = `${rule.divisionId}|${rule.districtId}|${rule.areaId}|${rule.remoteOnly ?? ""}`;
    if (ruleKeys.has(key)) {
      redirect(
        `/admin/delivery-zones${zoneId ? `/${zoneId}/edit` : "/new"}?error=Duplicate delivery rule`,
      );
    }
    ruleKeys.add(key || String(index));
  }
  const fallback = formBoolean(formData, "fallback");
  if (fallback) {
    const existingFallback = await prisma.deliveryZone.findFirst({
      where: {
        fallback: true,
        active: true,
        archivedAt: null,
        id: zoneId ? { not: zoneId } : undefined,
      },
      select: { id: true },
    });
    if (existingFallback) {
      redirect(
        `/admin/delivery-zones${zoneId ? `/${zoneId}/edit` : "/new"}?error=Only one active fallback zone is allowed`,
      );
    }
  }
  if (!fallback && !rules.length) {
    redirect(
      `/admin/delivery-zones${zoneId ? `/${zoneId}/edit` : "/new"}?error=Add at least one rule or mark this as fallback`,
    );
  }
  const data = {
    name: formString(formData, "name"),
    slug,
    description: formString(formData, "description") || null,
    deliveryFee: formNumber(formData, "deliveryFee"),
    freeDeliveryThreshold:
      formString(formData, "freeDeliveryThreshold") === ""
        ? null
        : formNumber(formData, "freeDeliveryThreshold"),
    minDeliveryDays: formNumber(formData, "minDeliveryDays"),
    maxDeliveryDays: formNumber(formData, "maxDeliveryDays"),
    codAvailable: formBoolean(formData, "codAvailable"),
    expressAvailable: formBoolean(formData, "expressAvailable"),
    expressFee:
      formString(formData, "expressFee") === ""
        ? null
        : formNumber(formData, "expressFee"),
    active: formBoolean(formData, "active"),
    sortOrder: formNumber(formData, "sortOrder"),
    fallback,
    pickup: formBoolean(formData, "pickup"),
  };
  if (!data.name || !data.slug) {
    redirect(
      `/admin/delivery-zones${zoneId ? `/${zoneId}/edit` : "/new"}?error=Name and slug are required`,
    );
  }
  if (
    data.deliveryFee < 0 ||
    (data.expressFee !== null && data.expressFee < 0)
  ) {
    redirect(
      `/admin/delivery-zones${zoneId ? `/${zoneId}/edit` : "/new"}?error=Delivery fees cannot be negative`,
    );
  }
  if (data.minDeliveryDays < 0 || data.maxDeliveryDays < data.minDeliveryDays) {
    redirect(
      `/admin/delivery-zones${zoneId ? `/${zoneId}/edit` : "/new"}?error=Delivery estimate is invalid`,
    );
  }
  const zone = await prisma.$transaction(async (tx) => {
    const saved = zoneId
      ? await tx.deliveryZone.update({ where: { id: zoneId }, data })
      : await tx.deliveryZone.create({ data });
    await tx.deliveryZoneRule.deleteMany({ where: { zoneId: saved.id } });
    if (rules.length) {
      await tx.deliveryZoneRule.createMany({
        data: rules.map((rule) => ({
          zoneId: saved.id,
          divisionId: rule.divisionId || null,
          districtId: rule.districtId || null,
          areaId: rule.areaId || null,
          priority: rule.priority,
          remoteOnly: rule.remoteOnly,
        })),
      });
    }
    return saved;
  });
  await audit({
    userId: admin.id,
    action: zoneId ? "delivery-zone.update" : "delivery-zone.create",
    entity: "DeliveryZone",
    entityId: zone.id,
    metadata: {
      slug: zone.slug,
      deliveryFee: data.deliveryFee,
      codAvailable: data.codAvailable,
      expressAvailable: data.expressAvailable,
    },
  });
  revalidatePath("/admin/delivery-zones");
  redirect(`/admin/delivery-zones/${zone.id}/edit?saved=1`);
}

export async function archiveDeliveryZoneAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const id = String(formData.get("zoneId"));
  await prisma.deliveryZone.update({
    where: { id },
    data: { active: false, archivedAt: new Date() },
  });
  await audit({
    userId: admin.id,
    action: "delivery-zone.archive",
    entity: "DeliveryZone",
    entityId: id,
  });
  revalidatePath("/admin/delivery-zones");
}

export async function deleteDeliveryZoneAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const id = String(formData.get("zoneId"));
  await prisma.deliveryZone.delete({ where: { id } });
  await audit({
    userId: admin.id,
    action: "delivery-zone.delete",
    entity: "DeliveryZone",
    entityId: id,
  });
  revalidatePath("/admin/delivery-zones");
  redirect("/admin/delivery-zones?deleted=1");
}

export async function duplicateDeliveryZoneAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const id = String(formData.get("zoneId"));
  const source = await prisma.deliveryZone.findUniqueOrThrow({
    where: { id },
    include: { rules: true },
  });
  const copy = await prisma.deliveryZone.create({
    data: {
      name: `${source.name} Copy`,
      slug: `${source.slug}-copy-${Date.now()}`,
      description: source.description,
      deliveryFee: source.deliveryFee,
      freeDeliveryThreshold: source.freeDeliveryThreshold,
      minDeliveryDays: source.minDeliveryDays,
      maxDeliveryDays: source.maxDeliveryDays,
      codAvailable: source.codAvailable,
      expressAvailable: source.expressAvailable,
      expressFee: source.expressFee,
      active: false,
      sortOrder: source.sortOrder + 1,
      fallback: false,
      pickup: source.pickup,
      metadata: source.metadata ?? undefined,
      rules: {
        create: source.rules.map((rule) => ({
          divisionId: rule.divisionId,
          districtId: rule.districtId,
          areaId: rule.areaId,
          priority: rule.priority,
          remoteOnly: rule.remoteOnly,
        })),
      },
    },
  });
  await audit({
    userId: admin.id,
    action: "delivery-zone.duplicate",
    entity: "DeliveryZone",
    entityId: copy.id,
    metadata: { sourceId: id },
  });
  redirect(`/admin/delivery-zones/${copy.id}/edit?saved=1`);
}

export async function moveDeliveryZoneAction(formData: FormData) {
  await requirePermission("settings.update");
  const id = String(formData.get("zoneId"));
  const direction = String(formData.get("direction")) === "down" ? 1 : -1;
  await prisma.deliveryZone.update({
    where: { id },
    data: { sortOrder: { increment: direction } },
  });
  revalidatePath("/admin/delivery-zones");
}

export async function saveCouponAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const couponId = formString(formData, "couponId");
  const code = normalizeCouponCode(formString(formData, "code"));
  const type = formString(formData, "type") as DiscountType;
  const backTo = couponId
    ? `/admin/coupons/${couponId}/edit`
    : "/admin/coupons/new";
  const percentageValue = optionalNumber(formData, "percentageValue");
  const fixedValue = optionalNumber(formData, "fixedValue");
  const maximumDiscount = optionalNumber(formData, "maximumDiscount");
  const minimumEligibleSubtotal = optionalNumber(
    formData,
    "minimumEligibleSubtotal",
  );
  const usageLimit = optionalInt(formData, "usageLimit");
  const perCustomerLimit = optionalInt(formData, "perCustomerLimit");
  const startsAt = optionalDate(formData, "startsAt");
  const expiresAt = optionalDate(formData, "expiresAt");
  const productIds = formStringArray(formData, "productIds");
  const categoryIds = formStringArray(formData, "categoryIds");
  const brandIds = formStringArray(formData, "brandIds");
  const customerIds = formStringArray(formData, "customerIds");
  const allowedPaymentMethods = formStringArray(
    formData,
    "allowedPaymentMethods",
  );
  if (!code || !Object.values(DiscountType).includes(type))
    redirect(`${backTo}?error=Invalid coupon details`);
  if (
    percentageValue !== undefined &&
    (percentageValue < 0 || percentageValue > 100)
  )
    redirect(`${backTo}?error=Percentage must be between 0 and 100`);
  if (fixedValue !== undefined && fixedValue < 0)
    redirect(`${backTo}?error=Fixed discount cannot be negative`);
  if (maximumDiscount !== undefined && maximumDiscount < 0)
    redirect(`${backTo}?error=Maximum discount cannot be negative`);
  if (usageLimit !== undefined && usageLimit < 0)
    redirect(`${backTo}?error=Usage limit cannot be negative`);
  if (perCustomerLimit !== undefined && perCustomerLimit < 0)
    redirect(`${backTo}?error=Per-user limit cannot be negative`);
  if (startsAt && expiresAt && expiresAt < startsAt)
    redirect(`${backTo}?error=End date cannot precede start date`);
  const existing = await prisma.coupon.findUnique({
    where: { normalizedCode: code },
  });
  if (existing && existing.id !== couponId)
    redirect(`${backTo}?error=Coupon code already exists`);
  await assertEligibleRecords(
    { productIds, categoryIds, brandIds, customerIds },
    backTo,
  );
  const value =
    type === DiscountType.FIXED || type === DiscountType.FREE_DELIVERY
      ? (fixedValue ?? 0)
      : (percentageValue ?? 0);
  const data = {
    code,
    normalizedCode: code,
    name: formString(formData, "name") || code,
    description: formString(formData, "description") || null,
    type,
    value,
    percentageValue: percentageValue ?? null,
    fixedValue: fixedValue ?? null,
    startsAt,
    expiresAt,
    usageLimit: usageLimit ?? null,
    perCustomerLimit: perCustomerLimit ?? null,
    minimumSpend: minimumEligibleSubtotal ?? null,
    minimumEligibleSubtotal: minimumEligibleSubtotal ?? null,
    maximumDiscount: maximumDiscount ?? null,
    active: formBoolean(formData, "active"),
    excludedSaleProducts: formBoolean(formData, "excludedSaleProducts"),
    stackable: formBoolean(formData, "stackable"),
    firstOrderOnly:
      formBoolean(formData, "firstOrderOnly") ||
      type === DiscountType.FIRST_ORDER,
    allowedPaymentMethods,
  };
  const coupon = await prisma.$transaction(async (tx) => {
    const saved = couponId
      ? await tx.coupon.update({ where: { id: couponId }, data })
      : await tx.coupon.create({ data });
    await tx.couponProduct.deleteMany({ where: { couponId: saved.id } });
    await tx.couponCategory.deleteMany({ where: { couponId: saved.id } });
    await tx.couponBrand.deleteMany({ where: { couponId: saved.id } });
    await tx.couponCustomer.deleteMany({ where: { couponId: saved.id } });
    if (productIds.length)
      await tx.couponProduct.createMany({
        data: productIds.map((productId) => ({
          couponId: saved.id,
          productId,
        })),
        skipDuplicates: true,
      });
    if (categoryIds.length)
      await tx.couponCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          couponId: saved.id,
          categoryId,
        })),
        skipDuplicates: true,
      });
    if (brandIds.length)
      await tx.couponBrand.createMany({
        data: brandIds.map((brandId) => ({ couponId: saved.id, brandId })),
        skipDuplicates: true,
      });
    if (customerIds.length)
      await tx.couponCustomer.createMany({
        data: customerIds.map((userId) => ({ couponId: saved.id, userId })),
        skipDuplicates: true,
      });
    return saved;
  });
  await audit({
    userId: admin.id,
    action: couponId ? "coupon.update" : "coupon.create",
    entity: "Coupon",
    entityId: coupon.id,
    metadata: { code },
  });
  revalidatePath("/admin/coupons");
  redirect(`/admin/coupons/${coupon.id}/edit?saved=1`);
}

export async function setCouponActiveAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const couponId = formString(formData, "couponId");
  const active = formString(formData, "active") === "true";
  const coupon = await prisma.coupon.update({
    where: { id: couponId },
    data: { active },
  });
  await audit({
    userId: admin.id,
    action: active ? "coupon.enable" : "coupon.disable",
    entity: "Coupon",
    entityId: coupon.id,
  });
  revalidatePath("/admin/coupons");
}

export async function archiveCouponAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const couponId = formString(formData, "couponId");
  const coupon = await prisma.coupon.update({
    where: { id: couponId },
    data: { active: false, archivedAt: new Date() },
  });
  await audit({
    userId: admin.id,
    action: "coupon.archive",
    entity: "Coupon",
    entityId: coupon.id,
  });
  revalidatePath("/admin/coupons");
}

export async function duplicateCouponAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const couponId = formString(formData, "couponId");
  const source = await prisma.coupon.findUniqueOrThrow({
    where: { id: couponId },
    include: {
      products: true,
      categories: true,
      brands: true,
      customers: true,
    },
  });
  const code = normalizeCouponCode(
    `${source.code}-COPY-${Date.now().toString().slice(-5)}`,
  );
  const copy = await prisma.coupon.create({
    data: {
      code,
      normalizedCode: code,
      name: `${source.name ?? source.code} Copy`,
      description: source.description,
      type: source.type,
      value: source.value,
      percentageValue: source.percentageValue,
      fixedValue: source.fixedValue,
      startsAt: source.startsAt,
      expiresAt: source.expiresAt,
      usageLimit: source.usageLimit,
      perCustomerLimit: source.perCustomerLimit,
      minimumSpend: source.minimumSpend,
      minimumEligibleSubtotal: source.minimumEligibleSubtotal,
      maximumDiscount: source.maximumDiscount,
      active: false,
      excludedSaleProducts: source.excludedSaleProducts,
      stackable: source.stackable,
      firstOrderOnly: source.firstOrderOnly,
      allowedPaymentMethods: source.allowedPaymentMethods,
      products: {
        create: source.products.map((row) => ({ productId: row.productId })),
      },
      categories: {
        create: source.categories.map((row) => ({
          categoryId: row.categoryId,
        })),
      },
      brands: {
        create: source.brands.map((row) => ({ brandId: row.brandId })),
      },
      customers: {
        create: source.customers.map((row) => ({ userId: row.userId })),
      },
    },
  });
  await audit({
    userId: admin.id,
    action: "coupon.duplicate",
    entity: "Coupon",
    entityId: copy.id,
    metadata: { sourceId: source.id },
  });
  revalidatePath("/admin/coupons");
  redirect(`/admin/coupons/${copy.id}/edit`);
}

export async function deleteCouponAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const couponId = formString(formData, "couponId");
  const usageCount = await prisma.couponUsage.count({ where: { couponId } });
  if (usageCount > 0)
    redirect(
      "/admin/coupons?error=Coupons with usage history can only be archived",
    );
  await prisma.coupon.delete({ where: { id: couponId } });
  await audit({
    userId: admin.id,
    action: "coupon.delete",
    entity: "Coupon",
    entityId: couponId,
  });
  revalidatePath("/admin/coupons");
}

export async function moderateReviewAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const reviewId = formString(formData, "reviewId");
  const action = formString(formData, "action");
  const data =
    action === "approve"
      ? {
          status: ReviewStatus.APPROVED,
          hiddenAt: null,
          moderatedAt: new Date(),
          moderatedById: admin.id,
        }
      : action === "reject"
        ? {
            status: ReviewStatus.REJECTED,
            hiddenAt: new Date(),
            moderatedAt: new Date(),
            moderatedById: admin.id,
          }
        : action === "hide"
          ? {
              status: ReviewStatus.HIDDEN,
              hiddenAt: new Date(),
              moderatedAt: new Date(),
              moderatedById: admin.id,
            }
          : action === "restore"
            ? {
                status: ReviewStatus.APPROVED,
                hiddenAt: null,
                moderatedAt: new Date(),
                moderatedById: admin.id,
              }
            : action === "suspicious"
              ? {
                  status: ReviewStatus.SUSPICIOUS,
                  suspicious: true,
                  moderatedAt: new Date(),
                  moderatedById: admin.id,
                }
              : null;
  if (!data) redirect(`/admin/reviews/${reviewId}?error=Invalid action`);
  const review = await prisma.review.update({ where: { id: reviewId }, data });
  await audit({
    userId: admin.id,
    action: `review.${action}`,
    entity: "Review",
    entityId: review.id,
  });
  await notifyUser({
    userId: review.userId,
    type:
      review.status === ReviewStatus.APPROVED
        ? "REVIEW_APPROVED"
        : "REVIEW_REJECTED",
    title:
      review.status === ReviewStatus.APPROVED
        ? "Review approved"
        : "Review updated",
    body: "Your product review moderation status changed.",
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/reviews/${review.id}`);
}

export async function setReviewFeaturedAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const reviewId = formString(formData, "reviewId");
  const featured = formString(formData, "featured") === "true";
  await prisma.review.update({ where: { id: reviewId }, data: { featured } });
  await audit({
    userId: admin.id,
    action: featured ? "review.feature" : "review.unfeature",
    entity: "Review",
    entityId: reviewId,
  });
  revalidatePath("/admin/reviews");
}

export async function saveReviewReplyAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const reviewId = formString(formData, "reviewId");
  const body = formString(formData, "body");
  if (!body) redirect(`/admin/reviews/${reviewId}?error=Reply is required`);
  await prisma.reviewReply.create({
    data: { reviewId, userId: admin.id, body, public: true },
  });
  await prisma.review.update({
    where: { id: reviewId },
    data: { reply: body },
  });
  await audit({
    userId: admin.id,
    action: "review.reply",
    entity: "Review",
    entityId: reviewId,
  });
  revalidatePath(`/admin/reviews/${reviewId}`);
}

export async function removeReviewReplyAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const replyId = formString(formData, "replyId");
  const reply = await prisma.reviewReply.delete({ where: { id: replyId } });
  await audit({
    userId: admin.id,
    action: "review.reply.remove",
    entity: "Review",
    entityId: reply.reviewId,
  });
  revalidatePath(`/admin/reviews/${reply.reviewId}`);
}

async function assertEligibleRecords(
  input: {
    productIds: string[];
    categoryIds: string[];
    brandIds: string[];
    customerIds: string[];
  },
  backTo: string,
) {
  const [products, categories, brands, customers] = await Promise.all([
    input.productIds.length
      ? prisma.product.count({
          where: {
            id: { in: input.productIds },
            status: ProductStatus.PUBLISHED,
            archivedAt: null,
          },
        })
      : 0,
    input.categoryIds.length
      ? prisma.category.count({
          where: {
            id: { in: input.categoryIds },
            active: true,
            archivedAt: null,
          },
        })
      : 0,
    input.brandIds.length
      ? prisma.brand.count({
          where: { id: { in: input.brandIds }, active: true, archivedAt: null },
        })
      : 0,
    input.customerIds.length
      ? prisma.user.count({
          where: { id: { in: input.customerIds }, status: "ACTIVE" },
        })
      : 0,
  ]);
  if (
    products !== input.productIds.length ||
    categories !== input.categoryIds.length ||
    brands !== input.brandIds.length ||
    customers !== input.customerIds.length
  ) {
    redirect(`${backTo}?error=Eligible records must exist and be active`);
  }
}

function optionalNumber(formData: FormData, name: string) {
  const value = formString(formData, name);
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function optionalInt(formData: FormData, name: string) {
  const value = optionalNumber(formData, name);
  return value === undefined ? undefined : Math.trunc(value);
}

function optionalDate(formData: FormData, name: string) {
  const value = formString(formData, name);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function isCategoryDescendant(candidateId: string, categoryId: string) {
  let currentId: string | null = candidateId;
  const visited = new Set<string>();
  while (currentId) {
    if (currentId === categoryId) return true;
    if (visited.has(currentId)) return true;
    visited.add(currentId);
    const current: { parentId: string | null } | null =
      await prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
    currentId = current?.parentId ?? null;
  }
  return false;
}

const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.CANCELLED,
  ],
  PAYMENT_CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.RETURNED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  DELIVERED: [OrderStatus.RETURNED],
  CANCELLED: [],
  RETURNED: [OrderStatus.REFUNDED],
  REFUNDED: [],
};

async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  actorId: string,
  note: string,
) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    if (order.status === toStatus) return;
    if (!allowedOrderTransitions[order.status].includes(toStatus)) {
      throw new Error(`Cannot move order from ${order.status} to ${toStatus}.`);
    }
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        shippedAt: toStatus === OrderStatus.SHIPPED ? new Date() : undefined,
        deliveredAt:
          toStatus === OrderStatus.DELIVERED ? new Date() : undefined,
        statusHistory: {
          create: { fromStatus: order.status, toStatus, note, actorId },
        },
      },
    });
    if (toStatus === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId },
        });
        if (!inventory) continue;
        const previousQuantity = inventory.available;
        const previousReserved = inventory.reserved;
        const quantity = item.quantity;
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            available: { increment: quantity },
            reserved: { decrement: Math.min(previousReserved, quantity) },
          },
        });
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { lowStockThreshold: true },
        });
        const newQuantity = previousQuantity + quantity;
        const newReserved = Math.max(0, previousReserved - quantity);
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newQuantity,
            reservedStock: newReserved,
            stockStatus:
              newQuantity <= 0
                ? "OUT_OF_STOCK"
                : newQuantity <= (product?.lowStockThreshold ?? 5)
                  ? "LOW_STOCK"
                  : "IN_STOCK",
          },
        });
        await tx.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            variantId: item.variantId,
            movementType: "RESERVATION_RELEASE",
            previousQuantity,
            newQuantity,
            difference: quantity,
            reservedBefore: previousReserved,
            reservedAfter: newReserved,
            reason: `Order ${order.number} cancelled`,
            reference: order.number,
            idempotencyKey: `cancel-${order.id}-${item.id}`,
            adminUserId: actorId,
          },
        });
      }
    }
  });
}

function formString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function formNumber(formData: FormData, name: string) {
  const value = Number(formData.get(name));
  return Number.isFinite(value) ? value : 0;
}

function formBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function formStringArray(formData: FormData, name: string) {
  return uniqueList(
    formData
      .getAll(name)
      .map(String)
      .map((value) => value.trim()),
  );
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function arrayValues(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => String(value).trim());
}

function checkboxValues(formData: FormData, name: string) {
  return new Set(formData.getAll(name).map(String));
}

export async function saveSiteSettingsAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const settings: SiteSettings = {
    general: {
      storeName: formString(formData, "general.storeName"),
      storeNameBn: formString(formData, "general.storeNameBn"),
      tagline: formString(formData, "general.tagline"),
      taglineBn: formString(formData, "general.taglineBn"),
      businessDescription: formString(formData, "general.businessDescription"),
      businessDescriptionBn: formString(formData, "general.businessDescriptionBn"),
      supportEmail: formString(formData, "general.supportEmail"),
      supportPhone: formString(formData, "general.supportPhone"),
      whatsappNumber: formString(formData, "general.whatsappNumber"),
      address: formString(formData, "general.address"),
      businessHours: formString(formData, "general.businessHours"),
      currency: formString(formData, "general.currency") || "BDT",
      timezone: formString(formData, "general.timezone") || "Asia/Dhaka",
      defaultLanguage: formString(formData, "general.defaultLanguage") || "en",
    },
    branding: {
      mainLogo: formString(formData, "branding.mainLogo"),
      compactLogo: formString(formData, "branding.compactLogo"),
      darkLogo: formString(formData, "branding.darkLogo"),
      lightLogo: formString(formData, "branding.lightLogo"),
      favicon: formString(formData, "branding.favicon"),
      primaryColour:
        formString(formData, "branding.primaryColour") ||
        defaultSiteSettings.branding.primaryColour,
      secondaryColour:
        formString(formData, "branding.secondaryColour") ||
        defaultSiteSettings.branding.secondaryColour,
      accentColour:
        formString(formData, "branding.accentColour") ||
        defaultSiteSettings.branding.accentColour,
      footerLogo: formString(formData, "branding.footerLogo"),
      openGraphImage: formString(formData, "branding.openGraphImage"),
      defaultProductImage: formString(formData, "branding.defaultProductImage"),
      defaultCategoryImage: formString(formData, "branding.defaultCategoryImage"),
      emailLogo: formString(formData, "branding.emailLogo"),
      invoiceLogo: formString(formData, "branding.invoiceLogo"),
    },
    commerce: {
      defaultDeliveryCharge: formNumber(
        formData,
        "commerce.defaultDeliveryCharge",
      ),
      freeDeliveryThreshold: formNumber(
        formData,
        "commerce.freeDeliveryThreshold",
      ),
      codEnabled: formBoolean(formData, "commerce.codEnabled"),
      onlinePaymentEnabled: formBoolean(
        formData,
        "commerce.onlinePaymentEnabled",
      ),
      taxEnabled: formBoolean(formData, "commerce.taxEnabled"),
      taxPercentage: formNumber(formData, "commerce.taxPercentage"),
      minimumOrderValue: formNumber(formData, "commerce.minimumOrderValue"),
      maximumOrderValue: formNumber(formData, "commerce.maximumOrderValue"),
      orderPrefix: formString(formData, "commerce.orderPrefix") || "KG",
      invoicePrefix: formString(formData, "commerce.invoicePrefix") || "INV",
      lowStockDefaultThreshold: formNumber(
        formData,
        "commerce.lowStockDefaultThreshold",
      ),
      defaultDeliveryZoneSlug:
        formString(formData, "commerce.defaultDeliveryZoneSlug") ||
        defaultSiteSettings.commerce.defaultDeliveryZoneSlug,
      freeDeliveryMessage:
        formString(formData, "commerce.freeDeliveryMessage") ||
        defaultSiteSettings.commerce.freeDeliveryMessage,
      storePickupInstructions:
        formString(formData, "commerce.storePickupInstructions") ||
        defaultSiteSettings.commerce.storePickupInstructions,
      deliveryEstimateWording:
        formString(formData, "commerce.deliveryEstimateWording") ||
        defaultSiteSettings.commerce.deliveryEstimateWording,
      expressDeliveryEnabled: formBoolean(
        formData,
        "commerce.expressDeliveryEnabled",
      ),
    },
    social: {
      facebook: formString(formData, "social.facebook"),
      instagram: formString(formData, "social.instagram"),
      youtube: formString(formData, "social.youtube"),
      tiktok: formString(formData, "social.tiktok"),
      linkedin: formString(formData, "social.linkedin"),
      whatsapp: formString(formData, "social.whatsapp"),
    },
    seo: {
      defaultPageTitle:
        formString(formData, "seo.defaultPageTitle") ||
        defaultSiteSettings.seo.defaultPageTitle,
      defaultMetaDescription:
        formString(formData, "seo.defaultMetaDescription") ||
        defaultSiteSettings.seo.defaultMetaDescription,
      defaultKeywords: formString(formData, "seo.defaultKeywords"),
      openGraphImage: formString(formData, "seo.openGraphImage"),
      canonicalSiteUrl:
        formString(formData, "seo.canonicalSiteUrl") ||
        defaultSiteSettings.seo.canonicalSiteUrl,
      robotsSettings:
        formString(formData, "seo.robotsSettings") ||
        defaultSiteSettings.seo.robotsSettings,
    },
  };
  await saveSiteSettings(settings);
  await audit({
    userId: admin.id,
    action: "settings.update",
    entity: "SiteSetting",
    entityId: "site",
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

function sectionFromForm(
  formData: FormData,
  key: keyof HomepageSettings,
  fallback: HomeSectionSettings,
): HomeSectionSettings {
  const prefix = `homepage.${String(key)}`;
  return {
    enabled: formBoolean(formData, `${prefix}.enabled`),
    title: formString(formData, `${prefix}.title`) || fallback.title,
    subtitle: formString(formData, `${prefix}.subtitle`),
    image: formString(formData, `${prefix}.image`),
    link: formString(formData, `${prefix}.link`),
    backgroundStyle:
      formString(formData, `${prefix}.backgroundStyle`) ||
      fallback.backgroundStyle,
    sortOrder: formNumber(formData, `${prefix}.sortOrder`),
    maxItems: formNumber(formData, `${prefix}.maxItems`) || fallback.maxItems,
  };
}

function productSectionFromForm(
  formData: FormData,
  prefix: string,
  fallback: ProductSectionSettings,
) {
  return {
    mode:
      formString(formData, `${prefix}.mode`) === "manual"
        ? ("manual" as const)
        : ("automatic" as const),
    productIds: formStringArray(formData, `${prefix}.productIds`),
    categoryIds: formStringArray(formData, `${prefix}.categoryIds`),
    brandIds: formStringArray(formData, `${prefix}.brandIds`),
    sortMethod:
      formString(formData, `${prefix}.sortMethod`) || fallback.sortMethod,
    fallbackStrategy:
      formString(formData, `${prefix}.fallbackStrategy`) ||
      fallback.fallbackStrategy,
    publishedWithinDays:
      formNumber(formData, `${prefix}.publishedWithinDays`) ||
      fallback.publishedWithinDays,
    dateRange: formString(formData, `${prefix}.dateRange`),
  };
}

function collectAnnouncementMessages(formData: FormData) {
  const ids = arrayValues(formData, "announcement.id");
  const enabled = checkboxValues(formData, "announcement.enabled");
  const messages = arrayValues(formData, "announcement.message");
  const links = arrayValues(formData, "announcement.link");
  const icons = arrayValues(formData, "announcement.icon");
  const priorities = arrayValues(formData, "announcement.priority");
  const starts = arrayValues(formData, "announcement.startDate");
  const ends = arrayValues(formData, "announcement.endDate");
  return ids
    .map((id, index) => ({
      id: id || `announcement-${index + 1}`,
      enabled: enabled.has(id || String(index)),
      message: messages[index] ?? "",
      link: links[index] ?? "",
      icon: icons[index] ?? "",
      priority: Number(priorities[index] ?? index),
      startDate: starts[index] ?? "",
      endDate: ends[index] ?? "",
    }))
    .filter((item) => item.message);
}

function collectHeroSlides(formData: FormData): HeroSlideSettings[] {
  const ids = arrayValues(formData, "heroSlide.id");
  const enabled = checkboxValues(formData, "heroSlide.enabled");
  const sortOrders = arrayValues(formData, "heroSlide.sortOrder");
  const titles = arrayValues(formData, "heroSlide.title");
  const highlightedTexts = arrayValues(formData, "heroSlide.highlightedText");
  const subtitles = arrayValues(formData, "heroSlide.subtitle");
  const descriptions = arrayValues(formData, "heroSlide.description");
  const images = arrayValues(formData, "heroSlide.image");
  const mobileImages = arrayValues(formData, "heroSlide.mobileImage");
  const primaryLabels = arrayValues(formData, "heroSlide.primaryButtonLabel");
  const primaryLinks = arrayValues(formData, "heroSlide.primaryButtonLink");
  const secondaryLabels = arrayValues(
    formData,
    "heroSlide.secondaryButtonLabel",
  );
  const secondaryLinks = arrayValues(formData, "heroSlide.secondaryButtonLink");
  const alignments = arrayValues(formData, "heroSlide.alignment");
  const backgrounds = arrayValues(formData, "heroSlide.backgroundStyle");
  const overlays = arrayValues(formData, "heroSlide.overlayStrength");
  const durations = arrayValues(formData, "heroSlide.durationMs");
  const starts = arrayValues(formData, "heroSlide.startDate");
  const ends = arrayValues(formData, "heroSlide.endDate");
  return ids
    .map((id, index) => ({
      id: id || `hero-slide-${index + 1}`,
      enabled: enabled.has(id || String(index)),
      sortOrder: Number(sortOrders[index] ?? index),
      title: titles[index] ?? "",
      highlightedText: highlightedTexts[index] ?? "",
      subtitle: subtitles[index] ?? "",
      description: descriptions[index] ?? "",
      image: images[index] ?? "",
      mobileImage: mobileImages[index] ?? "",
      primaryButtonLabel: primaryLabels[index] ?? "Shop now",
      primaryButtonLink: primaryLinks[index] ?? "/shop",
      secondaryButtonLabel: secondaryLabels[index] ?? "Explore categories",
      secondaryButtonLink: secondaryLinks[index] ?? "/categories",
      alignment: heroAlignment(alignments[index]),
      backgroundStyle: backgrounds[index] ?? "",
      overlayStrength: Number(overlays[index] ?? 35),
      durationMs: Number(durations[index] ?? 5200),
      startDate: starts[index] ?? "",
      endDate: ends[index] ?? "",
    }))
    .filter((item) => item.title);
}

function collectPromoCards(formData: FormData): PromoCardSettings[] {
  const ids = arrayValues(formData, "promo.id");
  const enabled = checkboxValues(formData, "promo.enabled");
  const sortOrders = arrayValues(formData, "promo.sortOrder");
  const titles = arrayValues(formData, "promo.title");
  const subtitles = arrayValues(formData, "promo.subtitle");
  const images = arrayValues(formData, "promo.image");
  const mobileImages = arrayValues(formData, "promo.mobileImage");
  const ctas = arrayValues(formData, "promo.ctaLabel");
  const links = arrayValues(formData, "promo.link");
  const backgrounds = arrayValues(formData, "promo.backgroundColour");
  const textColours = arrayValues(formData, "promo.textColour");
  const sizes = arrayValues(formData, "promo.size");
  const placements = arrayValues(formData, "promo.placement");
  const starts = arrayValues(formData, "promo.startDate");
  const ends = arrayValues(formData, "promo.endDate");
  return ids
    .map((id, index) => ({
      id: id || `promo-${index + 1}`,
      enabled: enabled.has(id || String(index)),
      sortOrder: Number(sortOrders[index] ?? index),
      title: titles[index] ?? "",
      subtitle: subtitles[index] ?? "",
      image: images[index] ?? "",
      mobileImage: mobileImages[index] ?? "",
      ctaLabel: ctas[index] ?? "Shop now",
      link: links[index] ?? "/shop",
      backgroundColour: backgrounds[index] ?? "#ffffff",
      textColour: textColours[index] ?? "#10264a",
      size: promoSize(sizes[index]),
      placement: promoPlacement(placements[index]),
      startDate: starts[index] ?? "",
      endDate: ends[index] ?? "",
    }))
    .filter((item) => item.title);
}

function heroAlignment(value?: string): HeroSlideSettings["alignment"] {
  return value === "center" || value === "right" ? value : "left";
}

function promoSize(value?: string): PromoCardSettings["size"] {
  return value === "small" || value === "large" ? value : "medium";
}

function promoPlacement(value?: string): PromoCardSettings["placement"] {
  if (value === "home-middle" || value === "category" || value === "shop") {
    return value;
  }
  return "home-upper";
}

function collectCategorySelections(formData: FormData) {
  const ids = arrayValues(formData, "categorySelection.categoryId");
  const titles = arrayValues(formData, "categorySelection.displayTitle");
  const images = arrayValues(formData, "categorySelection.imageOverride");
  const links = arrayValues(formData, "categorySelection.linkOverride");
  const sortOrders = arrayValues(formData, "categorySelection.sortOrder");
  return ids
    .map((categoryId, index) => ({
      categoryId,
      displayTitle: titles[index] ?? "",
      imageOverride: images[index] ?? "",
      linkOverride: links[index] ?? "",
      sortOrder: Number(sortOrders[index] ?? index),
    }))
    .filter((item) => item.categoryId);
}

function collectServiceBenefits(formData: FormData) {
  const ids = arrayValues(formData, "benefit.id");
  const enabled = checkboxValues(formData, "benefit.enabled");
  const sortOrders = arrayValues(formData, "benefit.sortOrder");
  const icons = arrayValues(formData, "benefit.icon");
  const titles = arrayValues(formData, "benefit.title");
  const descriptions = arrayValues(formData, "benefit.description");
  return ids
    .map((id, index) => ({
      id: id || `benefit-${index + 1}`,
      enabled: enabled.has(id || String(index)),
      sortOrder: Number(sortOrders[index] ?? index),
      icon: icons[index] ?? "shield",
      title: titles[index] ?? "",
      description: descriptions[index] ?? "",
    }))
    .filter((item) => item.title);
}

function collectAgeGroups(formData: FormData) {
  const ids = arrayValues(formData, "ageGroup.id");
  const enabled = checkboxValues(formData, "ageGroup.enabled");
  const labels = arrayValues(formData, "ageGroup.label");
  const slugs = arrayValues(formData, "ageGroup.slug");
  const minAges = arrayValues(formData, "ageGroup.minAge");
  const maxAges = arrayValues(formData, "ageGroup.maxAge");
  const descriptions = arrayValues(formData, "ageGroup.description");
  const images = arrayValues(formData, "ageGroup.image");
  const links = arrayValues(formData, "ageGroup.link");
  const attributes = arrayValues(formData, "ageGroup.ageAttribute");
  const sortOrders = arrayValues(formData, "ageGroup.sortOrder");
  return ids
    .map((id, index) => ({
      id: id || `age-${index + 1}`,
      enabled: enabled.has(id || String(index)),
      sortOrder: Number(sortOrders[index] ?? index),
      label: labels[index] ?? "",
      slug: slugs[index] ?? "",
      minAge: Number(minAges[index] ?? 0),
      maxAge: Number(maxAges[index] ?? 0),
      description: descriptions[index] ?? "",
      image: images[index] ?? "",
      link: links[index] ?? "",
      ageAttribute: attributes[index] ?? labels[index] ?? "",
    }))
    .filter((item) => item.label);
}

function collectBrandSelections(formData: FormData) {
  const ids = arrayValues(formData, "brandSelection.brandId");
  const names = arrayValues(formData, "brandSelection.displayName");
  const logos = arrayValues(formData, "brandSelection.logoOverride");
  const sortOrders = arrayValues(formData, "brandSelection.sortOrder");
  return ids
    .map((brandId, index) => ({
      brandId,
      displayName: names[index] ?? "",
      logoOverride: logos[index] ?? "",
      sortOrder: Number(sortOrders[index] ?? index),
    }))
    .filter((item) => item.brandId);
}

function collectInterestCollections(formData: FormData) {
  const ids = arrayValues(formData, "collection.id");
  const enabled = checkboxValues(formData, "collection.enabled");
  const names = arrayValues(formData, "collection.name");
  const descriptions = arrayValues(formData, "collection.description");
  const images = arrayValues(formData, "collection.image");
  const links = arrayValues(formData, "collection.link");
  const categoryIds = arrayValues(formData, "collection.categoryId");
  const tags = arrayValues(formData, "collection.tags");
  const productIds = arrayValues(formData, "collection.productIds");
  const sortOrders = arrayValues(formData, "collection.sortOrder");
  return ids
    .map((id, index) => ({
      id: id || `collection-${index + 1}`,
      enabled: enabled.has(id || String(index)),
      sortOrder: Number(sortOrders[index] ?? index),
      name: names[index] ?? "",
      description: descriptions[index] ?? "",
      image: images[index] ?? "",
      link: links[index] ?? "",
      categoryId: categoryIds[index] ?? "",
      tags:
        tags[index]
          ?.split(",")
          .map((tag) => tag.trim())
          .filter(Boolean) ?? [],
      productIds:
        productIds[index]
          ?.split(",")
          .map((idValue) => idValue.trim())
          .filter(Boolean) ?? [],
    }))
    .filter((item) => item.name);
}

export async function saveHomepageSettingsAction(formData: FormData) {
  const admin = await requirePermission("settings.update");
  const homepage: HomepageSettings = {
    announcementBar: {
      ...sectionFromForm(
        formData,
        "announcementBar",
        defaultHomepageSettings.announcementBar,
      ),
      highlightedText: formString(
        formData,
        "homepage.announcementBar.highlightedText",
      ),
    },
    hero: {
      ...sectionFromForm(formData, "hero", defaultHomepageSettings.hero),
      highlightedText: formString(formData, "homepage.hero.highlightedText"),
      primaryButtonLabel: formString(
        formData,
        "homepage.hero.primaryButtonLabel",
      ),
      primaryButtonLink: formString(
        formData,
        "homepage.hero.primaryButtonLink",
      ),
      secondaryButtonLabel: formString(
        formData,
        "homepage.hero.secondaryButtonLabel",
      ),
      secondaryButtonLink: formString(
        formData,
        "homepage.hero.secondaryButtonLink",
      ),
    },
    featuredCategories: sectionFromForm(
      formData,
      "featuredCategories",
      defaultHomepageSettings.featuredCategories,
    ),
    promotionalBanners: sectionFromForm(
      formData,
      "promotionalBanners",
      defaultHomepageSettings.promotionalBanners,
    ),
    trustBadges: sectionFromForm(
      formData,
      "trustBadges",
      defaultHomepageSettings.trustBadges,
    ),
    trending: sectionFromForm(
      formData,
      "trending",
      defaultHomepageSettings.trending,
    ),
    newArrivals: sectionFromForm(
      formData,
      "newArrivals",
      defaultHomepageSettings.newArrivals,
    ),
    bestSellers: sectionFromForm(
      formData,
      "bestSellers",
      defaultHomepageSettings.bestSellers,
    ),
    flashSale: sectionFromForm(
      formData,
      "flashSale",
      defaultHomepageSettings.flashSale,
    ),
    shopByAge: sectionFromForm(
      formData,
      "shopByAge",
      defaultHomepageSettings.shopByAge,
    ),
    shopByGender: sectionFromForm(
      formData,
      "shopByGender",
      defaultHomepageSettings.shopByGender,
    ),
    featuredBrands: sectionFromForm(
      formData,
      "featuredBrands",
      defaultHomepageSettings.featuredBrands,
    ),
    testimonials: sectionFromForm(
      formData,
      "testimonials",
      defaultHomepageSettings.testimonials,
    ),
    blogPreview: sectionFromForm(
      formData,
      "blogPreview",
      defaultHomepageSettings.blogPreview,
    ),
    newsletter: sectionFromForm(
      formData,
      "newsletter",
      defaultHomepageSettings.newsletter,
    ),
    announcementMessages: collectAnnouncementMessages(formData),
    heroSlides: collectHeroSlides(formData),
    sidePromoCards: collectPromoCards(formData),
    navigation: {
      topCategoryIds: formStringArray(formData, "navigation.topCategoryIds"),
      featuredCategoryIds: formStringArray(
        formData,
        "navigation.featuredCategoryIds",
      ),
      heroShortcutCategoryIds: formStringArray(
        formData,
        "navigation.heroShortcutCategoryIds",
      ),
    },
    categorySelections: collectCategorySelections(formData),
    serviceBenefits: collectServiceBenefits(formData),
    flashSaleConfig: {
      ...productSectionFromForm(
        formData,
        "flashSaleConfig",
        defaultHomepageSettings.flashSaleConfig,
      ),
      countdownEndDate: formString(
        formData,
        "flashSaleConfig.countdownEndDate",
      ),
      hideWhenExpired: formBoolean(formData, "flashSaleConfig.hideWhenExpired"),
      startDate: formString(formData, "flashSaleConfig.startDate"),
      endDate: formString(formData, "flashSaleConfig.endDate"),
    },
    trendingConfig: {
      ...productSectionFromForm(
        formData,
        "trendingConfig",
        defaultHomepageSettings.trendingConfig,
      ),
      tabCategoryIds: formStringArray(
        formData,
        "trendingConfig.tabCategoryIds",
      ),
      defaultTabCategoryId: formString(
        formData,
        "trendingConfig.defaultTabCategoryId",
      ),
    },
    bestSellerConfig: {
      ...productSectionFromForm(
        formData,
        "bestSellerConfig",
        defaultHomepageSettings.bestSellerConfig,
      ),
      useOrderData: formBoolean(formData, "bestSellerConfig.useOrderData"),
    },
    newArrivalConfig: productSectionFromForm(
      formData,
      "newArrivalConfig",
      defaultHomepageSettings.newArrivalConfig,
    ),
    ageGroups: collectAgeGroups(formData),
    featuredBrandSelections: collectBrandSelections(formData),
    dealOfDay: {
      enabled: formBoolean(formData, "dealOfDay.enabled"),
      productId: formString(formData, "dealOfDay.productId"),
      variantId: formString(formData, "dealOfDay.variantId"),
      title:
        formString(formData, "dealOfDay.title") ||
        defaultHomepageSettings.dealOfDay.title,
      description: formString(formData, "dealOfDay.description"),
      endDate: formString(formData, "dealOfDay.endDate"),
      ctaLabel:
        formString(formData, "dealOfDay.ctaLabel") ||
        defaultHomepageSettings.dealOfDay.ctaLabel,
      backgroundStyle: formString(formData, "dealOfDay.backgroundStyle"),
      imageOverride: formString(formData, "dealOfDay.imageOverride"),
    },
    interestCollections: collectInterestCollections(formData),
    recommendedConfig: productSectionFromForm(
      formData,
      "recommendedConfig",
      defaultHomepageSettings.recommendedConfig,
    ),
    reviewsConfig: {
      approvedOnly: true,
      featuredOnly: formBoolean(formData, "reviewsConfig.featuredOnly"),
      minimumRating:
        formNumber(formData, "reviewsConfig.minimumRating") ||
        defaultHomepageSettings.reviewsConfig.minimumRating,
      maxItems:
        formNumber(formData, "reviewsConfig.maxItems") ||
        defaultHomepageSettings.reviewsConfig.maxItems,
      reviewIds: formStringArray(formData, "reviewsConfig.reviewIds"),
      showVerifiedBadge: formBoolean(
        formData,
        "reviewsConfig.showVerifiedBadge",
      ),
      showProductLink: formBoolean(formData, "reviewsConfig.showProductLink"),
    },
    blogConfig: {
      mode:
        formString(formData, "blogConfig.mode") === "manual"
          ? "manual"
          : formString(formData, "blogConfig.mode") === "featured"
            ? "featured"
            : "latest",
      postIds: formStringArray(formData, "blogConfig.postIds"),
      category: formString(formData, "blogConfig.category"),
      maxItems:
        formNumber(formData, "blogConfig.maxItems") ||
        defaultHomepageSettings.blogConfig.maxItems,
      showExcerpt: formBoolean(formData, "blogConfig.showExcerpt"),
      showReadingTime: formBoolean(formData, "blogConfig.showReadingTime"),
      showCategory: formBoolean(formData, "blogConfig.showCategory"),
    },
    newsletterConfig: {
      buttonLabel:
        formString(formData, "newsletterConfig.buttonLabel") ||
        defaultHomepageSettings.newsletterConfig.buttonLabel,
      privacyNote:
        formString(formData, "newsletterConfig.privacyNote") ||
        defaultHomepageSettings.newsletterConfig.privacyNote,
      image: formString(formData, "newsletterConfig.image"),
      successMessage:
        formString(formData, "newsletterConfig.successMessage") ||
        defaultHomepageSettings.newsletterConfig.successMessage,
    },
  };
  try {
    await saveHomepageSettings(homepage);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid homepage settings";
    redirect(`/admin/homepage?error=${encodeURIComponent(message)}`);
  }
  await audit({
    userId: admin.id,
    action: "homepage.update",
    entity: "SiteSetting",
    entityId: "homepage",
  });
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/categories");
  revalidatePath("/admin/homepage");
  redirect("/admin/homepage?saved=1");
}
