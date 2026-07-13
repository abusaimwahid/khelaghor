import { prisma } from "./db";

export async function validateCoupon(input: { code?: string | null; subtotal: number; userId?: string | null; productIds?: string[] }) {
  const code = input.code?.trim().toUpperCase();
  if (!code) return { coupon: null, discount: 0 };
  const coupon = await prisma.coupon.findUnique({ where: { code }, include: { usages: true } });
  const now = new Date();
  if (!coupon || !coupon.active) throw new Error("Coupon is not valid.");
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("Coupon is not active yet.");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("Coupon has expired.");
  if (coupon.usageLimit && coupon.usages.length >= coupon.usageLimit) throw new Error("Coupon usage limit reached.");
  if (input.userId && coupon.perCustomerLimit) {
    const used = coupon.usages.filter((usage) => usage.userId === input.userId).length;
    if (used >= coupon.perCustomerLimit) throw new Error("You have already used this coupon.");
  }
  if (coupon.minimumSpend && input.subtotal < Number(coupon.minimumSpend)) throw new Error("Minimum spend not reached.");
  let discount = 0;
  if (coupon.type === "PERCENT") discount = input.subtotal * (Number(coupon.value) / 100);
  if (coupon.type === "FIXED") discount = Number(coupon.value);
  if (coupon.maximumDiscount) discount = Math.min(discount, Number(coupon.maximumDiscount));
  return { coupon, discount };
}
