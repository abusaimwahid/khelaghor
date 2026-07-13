import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "./db";
import { clearGuestCartTokenInAction, ensureGuestCartTokenInAction, readGuestCartToken } from "./security";

const cartInclude = {
  items: {
    include: {
      product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" } }, inventory: true } },
    },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export type CartView = CartWithItems | { id: string; userId: null; guestToken: null; couponCode: null; createdAt: Date; updatedAt: Date; items: [] };

function emptyGuestCart(): CartView {
  const now = new Date(0);
  return { id: "", userId: null, guestToken: null, couponCode: null, createdAt: now, updatedAt: now, items: [] };
}

export async function getCurrentCart(userId?: string | null): Promise<CartView> {
  if (userId) {
    return prisma.cart.upsert({
      where: { id: (await prisma.cart.findFirst({ where: { userId }, select: { id: true } }))?.id ?? "__missing__" },
      create: { userId },
      update: {},
      include: cartInclude,
    });
  }
  const guestToken = await readGuestCartToken();
  if (!guestToken) return emptyGuestCart();
  const existing = await prisma.cart.findFirst({ where: { guestToken }, include: cartInclude });
  if (existing) return existing;
  return emptyGuestCart();
}

export async function mergeGuestCart(userId: string) {
  const guestToken = await readGuestCartToken();
  if (!guestToken) return getCurrentCart(userId);
  const guest = await prisma.cart.findFirst({ where: { guestToken }, include: { items: true } });
  const userCart = await getCurrentCart(userId);
  if (!guest || guest.id === userCart.id) return userCart;
  for (const item of guest.items) {
    await updateCartItem({ userId, productId: item.productId, variantId: item.variantId ?? undefined, quantity: item.quantity, mode: "add" });
  }
  await prisma.cart.delete({ where: { id: guest.id } });
  await clearGuestCartTokenInAction();
  return getCurrentCart(userId);
}

export async function updateCartItem(input: { userId?: string | null; productId: string; variantId?: string; quantity: number; mode?: "set" | "add" }) {
  const cart = input.userId
    ? await getCurrentCart(input.userId)
    : await (async () => {
        const guestToken = await ensureGuestCartTokenInAction();
        const existing = await prisma.cart.findFirst({ where: { guestToken }, include: cartInclude });
        return existing ?? prisma.cart.create({ data: { guestToken }, include: cartInclude });
      })();
  const product = await prisma.product.findUnique({ where: { id: input.productId }, include: { variants: true, inventory: true } });
  if (!product || product.status !== ProductStatus.PUBLISHED || product.archivedAt) throw new Error("Product is not available.");
  const variant = input.variantId ? product.variants.find((item) => item.id === input.variantId) : null;
  if (input.variantId && !variant) throw new Error("Variant is not available.");
  const available = variant ? variant.stock : (product.inventory?.available ?? product.stock) - product.reservedStock;
  if (input.quantity < 0 || input.quantity > available) throw new Error("Requested quantity is not available.");
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: input.productId, variantId: input.variantId || null },
  });
  const nextQuantity = input.mode === "add" && existing ? existing.quantity + input.quantity : input.quantity;
  if (nextQuantity > available) throw new Error("Requested quantity exceeds available stock.");
  if (nextQuantity === 0) {
    if (existing) await prisma.cartItem.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: input.productId, variantId: input.variantId || null, quantity: nextQuantity } });
  }
  return getCurrentCart(input.userId);
}

export function secureCartTotals(cart: CartView, discount = 0, deliveryFee = 80) {
  const subtotal = cart.items.reduce((sum, item) => {
    const unit = Number(item.product.salePrice ?? item.product.regularPrice);
    return sum + unit * item.quantity;
  }, 0);
  const delivery = subtotal >= 3000 ? 0 : deliveryFee;
  return { subtotal, discount, delivery, total: Math.max(0, subtotal - discount + delivery) };
}
