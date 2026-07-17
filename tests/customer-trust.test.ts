import { OrderStatus, ProductStatus, ReturnStatus, ReviewStatus } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { secureCartTotals } from "@/server/cart";
import { evaluateCoupon, recordCouponUsage } from "@/server/coupons";
import { prisma } from "@/server/db";
import { createRefund } from "@/server/refunds";
import { approvedReviewStats, assertReviewEligibility } from "@/server/reviews";
import { createReturnRequest, inspectReturn, transitionReturn } from "@/server/returns";

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function fixture() {
  const user = await prisma.user.create({ data: { email: unique("trust@example.com"), name: "Trust Parent" } });
  const product = await prisma.product.create({
    data: {
      name: "Trust Product",
      slug: unique("trust-product"),
      sku: unique("TRUST"),
      shortDescription: "Trust",
      fullDescription: "Trust product",
      status: ProductStatus.PUBLISHED,
      regularPrice: 1000,
      stock: 5,
      inventory: { create: { available: 5 } },
    },
    include: { brand: true, images: true, inventory: true },
  });
  const order = await prisma.order.create({
    data: {
      number: unique("KG-TRUST"),
      userId: user.id,
      subtotal: 1000,
      discount: 0,
      deliveryFee: 60,
      total: 1060,
      status: OrderStatus.DELIVERED,
      paymentStatus: "PAID",
      deliveryMethod: "standard",
      paymentMethod: "COD",
      deliveredAt: new Date(),
      items: { create: { productId: product.id, name: product.name, sku: product.sku, quantity: 2, unitPrice: 1000 } },
    },
    include: { items: true },
  });
  const cart = await prisma.cart.create({
    data: { userId: user.id, items: { create: { productId: product.id, quantity: 1 } } },
    include: { items: { include: { product: { include: { brand: true, images: true, inventory: true } } }, orderBy: { id: "asc" } } },
  });
  return { user, product, order, orderItem: order.items[0], cart };
}

describe("customer trust workflows", () => {
  beforeEach(async () => {
    await prisma.coupon.deleteMany({ where: { normalizedCode: { startsWith: "TRUST" } } });
  });

  it("validates coupon date windows, free delivery and duplicate usage idempotently", async () => {
    const { user, cart, order } = await fixture();
    await prisma.coupon.create({
      data: {
        code: "TRUSTEXPIRED",
        normalizedCode: "TRUSTEXPIRED",
        name: "Expired",
        type: "PERCENT",
        value: 10,
        percentageValue: 10,
        active: true,
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    await expect(evaluateCoupon({ code: "trustexpired", cart, userId: user.id, paymentMethod: "COD", deliveryFee: 60 })).rejects.toThrow(/expired/i);
    const coupon = await prisma.coupon.create({
      data: { code: "TRUSTFREE", normalizedCode: "TRUSTFREE", name: "Free", type: "FREE_DELIVERY", value: 0, fixedValue: 0, active: true },
    });
    const result = await evaluateCoupon({ code: "trustfree", cart, userId: user.id, paymentMethod: "COD", deliveryFee: 60 });
    expect(result.deliveryDiscount).toBe(60);
    expect(secureCartTotals(cart, result.finalCouponDiscount, 60).total).toBe(1000);
    await recordCouponUsage({ couponId: coupon.id, userId: user.id, orderId: order.id });
    await recordCouponUsage({ couponId: coupon.id, userId: user.id, orderId: order.id });
    expect(await prisma.couponUsage.count({ where: { couponId: coupon.id, orderId: order.id } })).toBe(1);
  });

  it("enforces delivered-order review eligibility and approved-only aggregates", async () => {
    const { user, product, orderItem } = await fixture();
    await expect(assertReviewEligibility({ userId: user.id, orderItemId: orderItem.id })).resolves.toBeTruthy();
    await prisma.review.create({ data: { userId: user.id, productId: product.id, orderItemId: orderItem.id, rating: 5, text: "Excellent product", verifiedPurchase: true, status: ReviewStatus.APPROVED } });
    await prisma.review.create({ data: { userId: (await prisma.user.create({ data: { email: unique("hidden@example.com") } })).id, productId: product.id, rating: 1, text: "Hidden review", status: ReviewStatus.HIDDEN, hiddenAt: new Date() } });
    await expect(assertReviewEligibility({ userId: user.id, orderItemId: orderItem.id })).rejects.toThrow(/already reviewed/i);
    const stats = await approvedReviewStats(product.id);
    expect(stats.count).toBe(1);
    expect(stats.average).toBe(5);
  });

  it("changes return inventory only after inspection and separates damaged stock", async () => {
    const { user, product, orderItem } = await fixture();
    const before = await prisma.inventory.findUniqueOrThrow({ where: { productId: product.id } });
    const request = await createReturnRequest({ userId: user.id, orderItemId: orderItem.id, quantity: 1, reason: "Damaged product", resolution: "Refund" });
    expect((await prisma.inventory.findUniqueOrThrow({ where: { productId: product.id } })).available).toBe(before.available);
    await transitionReturn({ returnId: request.id, status: ReturnStatus.PRODUCT_RECEIVED, actorId: user.id });
    await inspectReturn({ returnId: request.id, actorId: user.id, resellable: false, note: "Damaged on arrival" });
    const after = await prisma.inventory.findUniqueOrThrow({ where: { productId: product.id } });
    expect(after.available).toBe(before.available);
    expect(after.damaged).toBe(before.damaged + 1);
  });

  it("prevents over-refunds and keeps support internal notes private", async () => {
    const { user, order } = await fixture();
    await expect(createRefund({ orderId: order.id, amount: 99999, method: "MANUAL", createdById: user.id })).rejects.toThrow(/exceeds/i);
    const ticket = await prisma.supportTicket.create({
      data: {
        number: unique("SUP"),
        userId: user.id,
        category: "Order",
        subject: "Help",
        messages: { create: { senderId: user.id, body: "Public question", public: true } },
        internalNotes: { create: { authorId: user.id, body: "Private note" } },
      },
      include: { messages: true, internalNotes: true },
    });
    const customerVisible = await prisma.supportMessage.findMany({ where: { ticketId: ticket.id, public: true } });
    expect(customerVisible).toHaveLength(1);
    expect(ticket.internalNotes).toHaveLength(1);
  });
});
