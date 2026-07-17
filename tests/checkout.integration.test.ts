import { afterAll, describe, expect, it } from "vitest";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { createOrderFromCart } from "@/server/checkout";

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureTestDeliveryZone() {
  await prisma.deliveryZone.upsert({
    where: { slug: "test-dhaka-checkout" },
    update: {},
    create: {
      name: "Test Dhaka Checkout",
      slug: "test-dhaka-checkout",
      deliveryFee: 60,
      minDeliveryDays: 1,
      maxDeliveryDays: 2,
      codAvailable: true,
      expressAvailable: true,
      expressFee: 120,
      sortOrder: -100,
      rules: {
        create: {
          divisionId: "dhaka",
          districtId: "dhaka-dhaka",
          areaId: "dhaka-dhanmondi",
          priority: 999,
        },
      },
    },
  });
}

describe("checkout integration", () => {
  afterAll(async () => {
    await prisma.deliveryZone.deleteMany({
      where: { slug: "test-dhaka-checkout" },
    });
  });

  it("creates one order per idempotency key and reduces stock once", async () => {
    await ensureTestDeliveryZone();
    const sku = unique("SKU");
    const product = await prisma.product.create({
      data: {
        name: "Integration Blocks",
        slug: unique("integration-blocks"),
        sku,
        shortDescription: "Safe integration product",
        fullDescription: "Safe integration product for checkout tests",
        status: ProductStatus.PUBLISHED,
        regularPrice: 1000,
        stock: 5,
        inventory: { create: { available: 5 } },
      },
      include: { brand: true, images: true, inventory: true },
    });
    const cart = await prisma.cart.create({
      data: {
        guestToken: unique("guest"),
        items: { create: { productId: product.id, quantity: 2 } },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                images: { orderBy: { sortOrder: "asc" } },
                inventory: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });
    const idempotencyKey = unique("idem");
    const input = {
      cart,
      idempotencyKey,
      fullName: "Test Parent",
      phone: "01700000000",
      email: "test@example.com",
      divisionId: "dhaka",
      districtId: "dhaka-dhaka",
      areaId: "dhaka-dhanmondi",
      address: "House 1",
      deliveryMethod: "standard" as const,
      paymentMethod: "COD",
    };
    const first = await createOrderFromCart(input);
    const second = await createOrderFromCart(input);
    const emptyRetry = await createOrderFromCart({
      ...input,
      cart: { ...cart, items: [] },
    });
    expect(second.id).toBe(first.id);
    expect(emptyRetry.id).toBe(first.id);
    expect(await prisma.order.count({ where: { idempotencyKey } })).toBe(1);
    const updated = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { inventory: true },
    });
    expect(updated.stock).toBe(3);
    expect(updated.inventory?.available).toBe(3);
    expect(await prisma.cartItem.count({ where: { cartId: cart.id } })).toBe(0);
  });

  it("does not clear the cart when checkout fails", async () => {
    await ensureTestDeliveryZone();
    const product = await prisma.product.create({
      data: {
        name: "No Stock Product",
        slug: unique("no-stock"),
        sku: unique("NSTOCK"),
        shortDescription: "No stock",
        fullDescription: "No stock product",
        status: ProductStatus.PUBLISHED,
        regularPrice: 100,
        stock: 0,
        inventory: { create: { available: 0 } },
      },
      include: { brand: true, images: true, inventory: true },
    });
    const cart = await prisma.cart.create({
      data: {
        guestToken: unique("guest"),
        items: { create: { productId: product.id, quantity: 1 } },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                images: { orderBy: { sortOrder: "asc" } },
                inventory: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });
    await expect(
      createOrderFromCart({
        cart,
        idempotencyKey: unique("idem"),
        fullName: "Test Parent",
        phone: "01700000000",
        divisionId: "dhaka",
        districtId: "dhaka-dhaka",
        areaId: "dhaka-dhanmondi",
        address: "House 1",
        deliveryMethod: "standard",
        paymentMethod: "COD",
      }),
    ).rejects.toThrow();
    expect(await prisma.cartItem.count({ where: { cartId: cart.id } })).toBe(1);
  });
});
