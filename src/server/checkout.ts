import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { CartView, secureCartTotals } from "./cart";
import { validateCoupon } from "./coupons";
import { notifyUser } from "./notify";
import { AppError } from "./errors";

function orderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `KG-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createOrderFromCart(input: {
  cart: CartView;
  userId?: string | null;
  idempotencyKey: string;
  fullName: string;
  phone: string;
  email?: string;
  division: string;
  district: string;
  area: string;
  postalCode?: string;
  address: string;
  landmark?: string;
  deliveryMethod: string;
  paymentMethod: string;
  couponCode?: string;
}) {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) {
    if (existing.userId && existing.userId !== input.userId) throw new AppError("Order is not available.", "ORDER_FORBIDDEN");
    return existing;
  }
  if (input.cart.items.length === 0) throw new AppError("Cart is empty.", "CART_EMPTY");

  try {
    return await prisma.$transaction(async (tx) => {
    const subtotal = input.cart.items.reduce((sum, item) => sum + Number(item.product.salePrice ?? item.product.regularPrice) * item.quantity, 0);
    const { coupon, discount } = await validateCoupon({
      code: input.couponCode,
      subtotal,
      userId: input.userId,
      productIds: input.cart.items.map((item) => item.productId),
    });
    const totals = secureCartTotals(input.cart, discount, input.deliveryMethod === "EXPRESS" ? 180 : 80);

    for (const item of input.cart.items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId }, include: { inventory: true } });
      const available = (product.inventory?.available ?? product.stock) - product.reservedStock;
      if (available < item.quantity) throw new AppError(`${product.name} does not have enough stock.`, "STOCK_UNAVAILABLE");
      await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: item.quantity }, reservedStock: { increment: item.quantity } } });
      await tx.inventory.updateMany({ where: { productId: product.id }, data: { available: { decrement: item.quantity }, reserved: { increment: item.quantity } } });
    }

    const address = await tx.address.create({
      data: {
        userId: input.userId ?? undefined,
        label: "Checkout",
        name: input.fullName,
        phone: input.phone,
        division: input.division,
        district: input.district,
        area: input.area,
        postalCode: input.postalCode,
        line1: input.address,
        landmark: input.landmark,
      },
    });

    const order = await tx.order.create({
      data: {
        number: orderNumber(),
        userId: input.userId ?? undefined,
        addressId: address.id,
        email: input.email,
        phone: input.phone,
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.delivery,
        total: totals.total,
        status: OrderStatus.PENDING,
        paymentStatus: input.paymentMethod === "COD" ? PaymentStatus.PENDING : PaymentStatus.PENDING,
        deliveryMethod: input.deliveryMethod,
        paymentMethod: input.paymentMethod,
        couponCode: coupon?.code,
        idempotencyKey: input.idempotencyKey,
        items: {
          create: input.cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.product.salePrice ?? item.product.regularPrice,
          })),
        },
        statusHistory: { create: { toStatus: OrderStatus.PENDING, note: "Order created" } },
        payments: {
          create: { provider: input.paymentMethod, status: PaymentStatus.PENDING, amount: totals.total },
        },
      },
    });

    if (coupon) await tx.couponUsage.create({ data: { couponId: coupon.id, userId: input.userId ?? undefined, orderId: order.id } });
    await tx.cartItem.deleteMany({ where: { cartId: input.cart.id } });
    await notifyUser({ userId: input.userId, type: "ORDER_CREATED", title: "Order received", body: `Order ${order.number} has been created.` });
    return order;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const racedOrder = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (racedOrder) {
        if (racedOrder.userId && racedOrder.userId !== input.userId) throw new AppError("Order is not available.", "ORDER_FORBIDDEN");
        return racedOrder;
      }
    }
    throw error;
  }
}
