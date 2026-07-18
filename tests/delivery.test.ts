import { ProductStatus } from "@prisma/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  findLocationByIds,
  getAreasByDistrict,
  getDistrictsByDivision,
  getDivisions,
  validateBangladeshAddress,
} from "@/data/bangladesh-locations";
import { createOrderFromCart } from "@/server/checkout";
import { DeliveryError, quoteDelivery } from "@/server/delivery";
import { prisma } from "@/server/db";
import { resetAndBootstrapTestDatabase } from "./cleanup";

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function resetTestZones() {
  await prisma.deliveryZone.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: "test-delivery-" } },
        { slug: "test-dhaka-checkout" },
      ],
    },
  });
}

describe("Bangladesh delivery", () => {
  beforeAll(resetAndBootstrapTestDatabase);
  beforeEach(async () => {
    await resetTestZones();
  });

  afterEach(async () => {
    await resetTestZones();
  });

  it("exposes 8 divisions and validates parent-child address IDs", () => {
    expect(getDivisions()).toHaveLength(8);
    expect(
      getDistrictsByDivision("dhaka").some(
        (district) => district.name === "Dhaka",
      ),
    ).toBe(true);
    expect(
      getAreasByDistrict("dhaka-dhaka").some(
        (area) => area.id === "dhaka-dhanmondi",
      ),
    ).toBe(true);
    expect(
      validateBangladeshAddress({
        divisionId: "dhaka",
        districtId: "dhaka-dhaka",
        areaId: "dhaka-dhanmondi",
      }).ok,
    ).toBe(true);
    expect(
      validateBangladeshAddress({
        divisionId: "sylhet",
        districtId: "dhaka-dhaka",
        areaId: "dhaka-dhanmondi",
      }).ok,
    ).toBe(false);
    expect(
      findLocationByIds({
        divisionId: "dhaka",
        districtId: "dhaka-dhaka",
        areaId: "bad",
      }).area,
    ).toBeUndefined();
  });

  it("matches exact area before district and applies standard/free delivery fees", async () => {
    await prisma.deliveryZone.create({
      data: {
        name: "Test Delivery District",
        slug: "test-delivery-district",
        deliveryFee: 100,
        freeDeliveryThreshold: 1000,
        minDeliveryDays: 2,
        maxDeliveryDays: 4,
        sortOrder: 10,
        rules: {
          create: {
            divisionId: "dhaka",
            districtId: "dhaka-dhaka",
            priority: 10,
          },
        },
      },
    });
    await prisma.deliveryZone.create({
      data: {
        name: "Test Delivery Exact",
        slug: "test-delivery-exact",
        deliveryFee: 60,
        freeDeliveryThreshold: 2000,
        minDeliveryDays: 1,
        maxDeliveryDays: 2,
        sortOrder: 20,
        rules: {
          create: {
            divisionId: "dhaka",
            districtId: "dhaka-dhaka",
            areaId: "dhaka-dhanmondi",
            priority: 1000,
          },
        },
      },
    });
    await prisma.deliveryZone.create({
      data: {
        name: "Test Delivery Pickup",
        slug: "test-delivery-pickup",
        deliveryFee: 0,
        minDeliveryDays: 0,
        maxDeliveryDays: 1,
        pickup: true,
        rules: {
          create: {
            divisionId: "dhaka",
            districtId: "dhaka-dhaka",
            priority: 1,
          },
        },
      },
    });

    const paid = await quoteDelivery({
      divisionId: "dhaka",
      districtId: "dhaka-dhaka",
      areaId: "dhaka-dhanmondi",
      deliveryMethod: "standard",
      paymentMethod: "COD",
      subtotal: 1500,
    });
    const free = await quoteDelivery({
      divisionId: "dhaka",
      districtId: "dhaka-dhaka",
      areaId: "dhaka-dhanmondi",
      deliveryMethod: "standard",
      paymentMethod: "COD",
      subtotal: 2500,
    });
    const pickup = await quoteDelivery({
      divisionId: "dhaka",
      districtId: "dhaka-dhaka",
      areaId: "dhaka-dhanmondi",
      deliveryMethod: "pickup",
      paymentMethod: "COD",
      subtotal: 1500,
    });

    expect(paid.zoneName).toBe("Test Delivery Exact");
    expect(paid.deliveryFee).toBe(60);
    expect(free.deliveryFee).toBe(0);
    expect(free.freeDeliveryApplied).toBe(true);
    expect(pickup.zoneName).toBe("Test Delivery Pickup");
    expect(pickup.deliveryFee).toBe(0);
  });

  it("uses district fallback, express fee and COD errors", async () => {
    await prisma.deliveryZone.create({
      data: {
        name: "Test Delivery District Express",
        slug: "test-delivery-district-express",
        deliveryFee: 90,
        minDeliveryDays: 2,
        maxDeliveryDays: 3,
        codAvailable: false,
        expressAvailable: true,
        expressFee: 150,
        rules: {
          create: {
            divisionId: "dhaka",
            districtId: "dhaka-gazipur",
            priority: 500,
          },
        },
      },
    });

    const express = await quoteDelivery({
      divisionId: "dhaka",
      districtId: "dhaka-gazipur",
      areaId: "gazipur-tongi",
      deliveryMethod: "express",
      paymentMethod: "SSLCOMMERZ",
      subtotal: 500,
    });

    expect(express.deliveryFee).toBe(150);
    expect(express.expressAvailable).toBe(true);
    await expect(
      quoteDelivery({
        divisionId: "dhaka",
        districtId: "dhaka-gazipur",
        areaId: "gazipur-tongi",
        deliveryMethod: "standard",
        paymentMethod: "COD",
        subtotal: 500,
      }),
    ).rejects.toMatchObject({ code: "COD_UNAVAILABLE" });
  });

  it("rejects express when unavailable and stores delivery snapshots on final checkout", async () => {
    await prisma.deliveryZone.create({
      data: {
        name: "Test Delivery Checkout",
        slug: "test-delivery-checkout",
        deliveryFee: 77,
        minDeliveryDays: 3,
        maxDeliveryDays: 5,
        codAvailable: true,
        expressAvailable: false,
        rules: {
          create: {
            divisionId: "chattogram",
            districtId: "chattogram-chattogram",
            areaId: "chattogram-agrabad",
            priority: 80,
          },
        },
      },
    });
    await expect(
      quoteDelivery({
        divisionId: "chattogram",
        districtId: "chattogram-chattogram",
        areaId: "chattogram-agrabad",
        deliveryMethod: "express",
        paymentMethod: "SSLCOMMERZ",
        subtotal: 500,
      }),
    ).rejects.toBeInstanceOf(DeliveryError);

    const product = await prisma.product.create({
      data: {
        name: "Delivery Snapshot Product",
        slug: unique("delivery-snapshot"),
        sku: unique("DSP"),
        shortDescription: "Delivery test",
        fullDescription: "Delivery test product",
        status: ProductStatus.PUBLISHED,
        regularPrice: 500,
        stock: 4,
        inventory: { create: { available: 4 } },
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
    const order = await createOrderFromCart({
      cart,
      idempotencyKey: unique("idem"),
      fullName: "Delivery Parent",
      phone: "01700000000",
      email: "delivery@example.com",
      divisionId: "chattogram",
      districtId: "chattogram-chattogram",
      areaId: "chattogram-agrabad",
      address: "House 1",
      deliveryMethod: "standard",
      paymentMethod: "COD",
    });
    const saved = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });

    expect(Number(saved.deliveryFee)).toBe(77);
    expect(saved.deliveryZoneName).toBe("Test Delivery Checkout");
    expect(saved.deliveryEstimateMinDays).toBe(3);
    expect(saved.deliveryEstimateMaxDays).toBe(5);
    expect(saved.codAvailableSnapshot).toBe(true);
  });
});
