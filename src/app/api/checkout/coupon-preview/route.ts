import { NextResponse } from "next/server";
import { getCurrentCart } from "@/server/cart";
import { evaluateCoupon, CouponError } from "@/server/coupons";
import { assertRateLimit, currentUser } from "@/server/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await assertRateLimit("coupon-preview", 30);
    const user = await currentUser();
    const cart = await getCurrentCart(user?.id);
    const body = await request.json() as { code?: string; paymentMethod?: string; deliveryFee?: number };
    const result = await evaluateCoupon({
      code: body.code,
      cart,
      userId: user?.id,
      paymentMethod: body.paymentMethod ?? "COD",
      deliveryFee: Number(body.deliveryFee ?? 0),
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof CouponError ? error.message : "Coupon could not be applied." },
      { status: 400 },
    );
  }
}
