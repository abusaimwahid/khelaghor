import { z } from "zod";

export type CartLine = {
  price: number;
  salePrice?: number | null;
  quantity: number;
};
export type Coupon = {
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_DELIVERY";
  value: number;
  minimumSpend?: number;
  maximumDiscount?: number;
};

export const checkoutSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  division: z.string().min(2),
  district: z.string().min(2),
  area: z.string().min(2),
  address: z.string().min(8),
  paymentMethod: z.enum([
    "COD",
    "SSLCOMMERZ",
    "BKASH",
    "NAGAD",
    "ROCKET",
    "CARD",
  ]),
});

export function linePrice(line: CartLine) {
  return (line.salePrice ?? line.price) * line.quantity;
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + linePrice(line), 0);
}

export function discountAmount(subtotal: number, coupon?: Coupon | null) {
  if (!coupon || subtotal < (coupon.minimumSpend ?? 0)) return 0;
  if (coupon.type === "FREE_DELIVERY") return 0;
  const raw =
    coupon.type === "PERCENT" ? subtotal * (coupon.value / 100) : coupon.value;
  return Math.min(raw, coupon.maximumDiscount ?? raw);
}

export function deliveryFee(subtotal: number, method = "STANDARD") {
  if (subtotal >= 3000) return 0;
  if (method === "EXPRESS") return 180;
  return 80;
}

export function orderTotal(
  lines: CartLine[],
  coupon?: Coupon | null,
  method = "STANDARD",
) {
  const subtotal = cartSubtotal(lines);
  const discount = discountAmount(subtotal, coupon);
  const delivery =
    coupon?.type === "FREE_DELIVERY" ? 0 : deliveryFee(subtotal, method);
  return {
    subtotal,
    discount,
    delivery,
    total: Math.max(0, subtotal - discount + delivery),
  };
}

export function canTransitionOrder(from: string, to: string) {
  const map: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PAYMENT_CONFIRMED", "PROCESSING", "CANCELLED"],
    PAYMENT_CONFIRMED: ["PROCESSING", "REFUNDED"],
    PROCESSING: ["PACKED", "CANCELLED"],
    PACKED: ["SHIPPED"],
    SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
    OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
    DELIVERED: ["RETURNED", "REFUNDED"],
  };
  return map[from]?.includes(to) ?? false;
}

export function hasPermission(userPermissions: string[], required: string) {
  return userPermissions.includes("*") || userPermissions.includes(required);
}
