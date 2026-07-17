import { DiscountType, ProductStatus, type Prisma } from "@prisma/client";
import type { CartView } from "./cart";
import { prisma } from "./db";

type Db = typeof prisma | Prisma.TransactionClient;

export type CouponResult = {
  valid: boolean;
  message: string;
  couponId?: string;
  couponCode?: string;
  eligibleSubtotal: number;
  productDiscount: number;
  orderDiscount: number;
  deliveryDiscount: number;
  finalCouponDiscount: number;
  appliedRules: string[];
};

export class CouponError extends Error {
  constructor(
    message: string,
    readonly code = "COUPON_INVALID",
  ) {
    super(message);
  }
}

export function normalizeCouponCode(code?: string | null) {
  return code?.trim().toUpperCase() ?? "";
}

export async function evaluateCoupon(input: {
  code?: string | null;
  cart: CartView;
  userId?: string | null;
  paymentMethod: string;
  deliveryFee: number;
  now?: Date;
  db?: Db;
}): Promise<CouponResult> {
  const code = normalizeCouponCode(input.code);
  if (!code) {
    return emptyCouponResult("No coupon applied.");
  }
  const db = input.db ?? prisma;
  const now = input.now ?? new Date();
  const coupon = await db.coupon.findUnique({
    where: { normalizedCode: code },
    include: {
      usages: true,
      products: true,
      categories: true,
      brands: true,
      customers: true,
    },
  });
  if (!coupon || coupon.archivedAt || !coupon.active) {
    throw new CouponError("Coupon is not valid.");
  }
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new CouponError("Coupon is not active yet.");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new CouponError("Coupon has expired.");
  }
  if (coupon.usageLimit !== null && coupon.usages.length >= coupon.usageLimit) {
    throw new CouponError("Coupon usage limit reached.");
  }
  if (coupon.perCustomerLimit !== null && input.userId) {
    const used = coupon.usages.filter(
      (usage) => usage.userId === input.userId,
    ).length;
    if (used >= coupon.perCustomerLimit) {
      throw new CouponError("You have already used this coupon.");
    }
  }
  if (coupon.firstOrderOnly || coupon.type === DiscountType.FIRST_ORDER) {
    if (!input.userId)
      throw new CouponError("Please sign in to use this first-order coupon.");
    const previousOrders = await db.order.count({
      where: { userId: input.userId },
    });
    if (previousOrders > 0)
      throw new CouponError("This coupon is only for first orders.");
  }
  if (coupon.customers.length > 0) {
    if (
      !input.userId ||
      !coupon.customers.some((row) => row.userId === input.userId)
    ) {
      throw new CouponError("This coupon is not available for this account.");
    }
  }
  if (
    coupon.allowedPaymentMethods.length > 0 &&
    !coupon.allowedPaymentMethods.includes(input.paymentMethod)
  ) {
    throw new CouponError(
      "This coupon is not available for the selected payment method.",
    );
  }

  const items = await loadCouponCartItems(input.cart, db);
  const eligibleItems = items.filter((item) => {
    if (coupon.excludedSaleProducts && item.salePrice !== null) return false;
    if (
      coupon.products.length > 0 &&
      !coupon.products.some((row) => row.productId === item.productId)
    )
      return false;
    if (
      coupon.brands.length > 0 &&
      (!item.brandId ||
        !coupon.brands.some((row) => row.brandId === item.brandId))
    )
      return false;
    if (
      coupon.categories.length > 0 &&
      !item.categoryIds.some((categoryId) =>
        coupon.categories.some((row) => row.categoryId === categoryId),
      )
    ) {
      return false;
    }
    return true;
  });
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const eligibleSubtotal = eligibleItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const minimum = Number(
    coupon.minimumEligibleSubtotal ?? coupon.minimumSpend ?? 0,
  );
  if (minimum > 0 && eligibleSubtotal < minimum) {
    throw new CouponError(`Minimum eligible subtotal is ${minimum}.`);
  }
  if (eligibleSubtotal <= 0 && coupon.type !== DiscountType.FREE_DELIVERY) {
    throw new CouponError("No cart items are eligible for this coupon.");
  }

  const value = Number(
    coupon.percentageValue ?? coupon.fixedValue ?? coupon.value ?? 0,
  );
  let productDiscount = 0;
  let orderDiscount = 0;
  let deliveryDiscount = 0;
  const appliedRules: string[] = [];
  const percentageTypes: DiscountType[] = [
    DiscountType.PERCENT,
    DiscountType.PRODUCT,
    DiscountType.CATEGORY,
    DiscountType.BRAND,
    DiscountType.FIRST_ORDER,
    DiscountType.CUSTOMER,
    DiscountType.PAYMENT_METHOD,
  ];

  if (coupon.type === DiscountType.FREE_DELIVERY) {
    deliveryDiscount = Math.max(0, input.deliveryFee);
    appliedRules.push("free-delivery");
  } else if (coupon.type === DiscountType.FIXED) {
    orderDiscount = Math.min(value, eligibleSubtotal);
    appliedRules.push("fixed-amount");
  } else if (percentageTypes.includes(coupon.type)) {
    orderDiscount = eligibleSubtotal * (value / 100);
    appliedRules.push("percentage");
  } else {
    throw new CouponError("Coupon type is not supported yet.");
  }
  if (coupon.maximumDiscount !== null) {
    const cap = Number(coupon.maximumDiscount);
    const combined = orderDiscount + productDiscount + deliveryDiscount;
    if (combined > cap) {
      const ratio = cap / combined;
      productDiscount *= ratio;
      orderDiscount *= ratio;
      deliveryDiscount *= ratio;
      appliedRules.push("maximum-discount");
    }
  }
  const maxDiscount = subtotal + Math.max(0, input.deliveryFee);
  const finalCouponDiscount = Math.min(
    roundMoney(productDiscount + orderDiscount + deliveryDiscount),
    maxDiscount,
  );
  if (finalCouponDiscount <= 0 && coupon.type !== DiscountType.FREE_DELIVERY)
    throw new CouponError("Coupon has no discount for this cart.");
  return {
    valid: true,
    message:
      coupon.expiresAt &&
      coupon.expiresAt.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000
        ? "Coupon applied. It expires soon."
        : "Coupon applied.",
    couponId: coupon.id,
    couponCode: coupon.code,
    eligibleSubtotal: roundMoney(eligibleSubtotal),
    productDiscount: roundMoney(productDiscount),
    orderDiscount: roundMoney(orderDiscount),
    deliveryDiscount: roundMoney(deliveryDiscount),
    finalCouponDiscount,
    appliedRules,
  };
}

export async function recordCouponUsage(input: {
  couponId?: string;
  userId?: string | null;
  orderId: string;
  db?: Db;
}) {
  if (!input.couponId) return;
  const db = input.db ?? prisma;
  await db.couponUsage.upsert({
    where: {
      couponId_orderId: { couponId: input.couponId, orderId: input.orderId },
    },
    update: {},
    create: {
      couponId: input.couponId,
      userId: input.userId ?? undefined,
      orderId: input.orderId,
    },
  });
}

function emptyCouponResult(message: string): CouponResult {
  return {
    valid: false,
    message,
    eligibleSubtotal: 0,
    productDiscount: 0,
    orderDiscount: 0,
    deliveryDiscount: 0,
    finalCouponDiscount: 0,
    appliedRules: [],
  };
}

async function loadCouponCartItems(cart: CartView, db: Db) {
  const products = await db.product.findMany({
    where: {
      id: { in: cart.items.map((item) => item.productId) },
      status: ProductStatus.PUBLISHED,
      archivedAt: null,
    },
    include: { categories: true },
  });
  return cart.items.flatMap((cartItem) => {
    const product = products.find((row) => row.id === cartItem.productId);
    if (!product) return [];
    const unitPrice = Number(product.salePrice ?? product.regularPrice);
    return {
      productId: product.id,
      variantId: cartItem.variantId,
      brandId: product.brandId,
      categoryIds: product.categories.map((row) => row.categoryId),
      salePrice: product.salePrice,
      unitPrice,
      quantity: cartItem.quantity,
    };
  });
}

function roundMoney(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}
