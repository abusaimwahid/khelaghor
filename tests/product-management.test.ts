import { describe, expect, it } from "vitest";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { productSchema } from "@/server/validation";

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("product management", () => {
  it("rejects sale prices above regular price", () => {
    const parsed = productSchema.safeParse({
      name: "Wooden Puzzle",
      slug: "wooden-puzzle",
      sku: "WP-1",
      categoryId: "category",
      shortDescription: "Safe wooden puzzle",
      fullDescription: "Safe wooden puzzle for early learning",
      regularPrice: 500,
      salePrice: 700,
      stock: 10,
      status: "PUBLISHED",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects sale end dates before sale start dates", () => {
    const parsed = productSchema.safeParse({
      name: "Story Book",
      slug: "story-book",
      sku: "SB-1",
      categoryId: "category",
      shortDescription: "Illustrated story book",
      fullDescription: "Illustrated story book for bedtime reading",
      regularPrice: 300,
      saleStartsAt: "2026-07-20T00:00",
      saleEndsAt: "2026-07-19T00:00",
      stock: 10,
      status: "DRAFT",
    });
    expect(parsed.success).toBe(false);
  });

  it("enforces unique variant SKUs in PostgreSQL", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Variant Test Product",
        slug: unique("variant-test-product"),
        sku: unique("VTP"),
        shortDescription: "Variant test",
        fullDescription: "Variant test product",
        regularPrice: 100,
        status: ProductStatus.DRAFT,
        inventory: { create: { available: 0 } },
      },
    });
    const sku = unique("VAR");
    await prisma.productVariant.create({
      data: { productId: product.id, sku, stock: 1 },
    });
    await expect(
      prisma.productVariant.create({
        data: { productId: product.id, sku, stock: 1 },
      }),
    ).rejects.toThrow();
  });
});
