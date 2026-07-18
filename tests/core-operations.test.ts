import { ProductStatus } from "@prisma/client";
import { beforeAll, describe, expect, it } from "vitest";
import { adjustInventory } from "@/server/inventory";
import { prisma } from "@/server/db";
import { resetAndBootstrapTestDatabase } from "./cleanup";

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createInventoryProduct(stock = 5) {
  return prisma.product.create({
    data: {
      name: "Inventory Test Product",
      slug: unique("inventory-test-product"),
      sku: unique("INV"),
      shortDescription: "Inventory test",
      fullDescription: "Inventory test product",
      regularPrice: 100,
      stock,
      status: ProductStatus.DRAFT,
      inventory: { create: { available: stock, reserved: 0 } },
    },
    include: { inventory: true },
  });
}

describe("core operations", () => {
  beforeAll(resetAndBootstrapTestDatabase);
  it("records stock increases with previous and new quantity", async () => {
    const product = await createInventoryProduct(4);
    const movement = await adjustInventory({
      productId: product.id,
      difference: 3,
      movementType: "PURCHASE_RESTOCK",
      reason: "Supplier restock",
      reference: "PO-1",
    });

    expect(movement.previousQuantity).toBe(4);
    expect(movement.newQuantity).toBe(7);
    expect(movement.difference).toBe(3);
    expect(movement.movementType).toBe("PURCHASE_RESTOCK");
  });

  it("prevents negative stock", async () => {
    const product = await createInventoryProduct(2);

    await expect(
      adjustInventory({
        productId: product.id,
        difference: -3,
        movementType: "MANUAL_DECREASE",
        reason: "Bad count",
      }),
    ).rejects.toThrow(/negative/i);
  });

  it("deduplicates repeated stock adjustments by idempotency key", async () => {
    const product = await createInventoryProduct(6);
    const key = unique("stock-adjust");

    const first = await adjustInventory({
      productId: product.id,
      difference: 2,
      movementType: "CORRECTION",
      reason: "Cycle count",
      idempotencyKey: key,
    });
    const second = await adjustInventory({
      productId: product.id,
      difference: 2,
      movementType: "CORRECTION",
      reason: "Cycle count duplicate",
      idempotencyKey: key,
    });
    const inventory = await prisma.inventory.findUniqueOrThrow({
      where: { productId: product.id },
    });

    expect(second.id).toBe(first.id);
    expect(inventory.available).toBe(8);
  });
});
