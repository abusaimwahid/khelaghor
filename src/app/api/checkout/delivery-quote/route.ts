import { NextResponse } from "next/server";
import { getCurrentCart } from "@/server/cart";
import { DeliveryError, quoteDelivery, type DeliveryMethod } from "@/server/delivery";
import { assertRateLimit, currentUser } from "@/server/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await assertRateLimit("delivery-quote", 20);
    const body = (await request.json().catch(() => ({}))) as {
      divisionId?: string;
      districtId?: string;
      areaId?: string;
      deliveryMethod?: string;
      paymentMethod?: string;
    };
    const user = await currentUser();
    const cart = await getCurrentCart(user?.id);
    const subtotal = cart.items.reduce(
      (sum, item) =>
        sum + Number(item.product.salePrice ?? item.product.regularPrice) * item.quantity,
      0,
    );
    const quote = await quoteDelivery({
      divisionId: body.divisionId ?? "",
      districtId: body.districtId ?? "",
      areaId: body.areaId ?? "",
      deliveryMethod: normaliseMethod(body.deliveryMethod),
      paymentMethod: body.paymentMethod || "COD",
      subtotal,
    });
    return NextResponse.json({ ok: true, subtotal, quote });
  } catch (error) {
    const message =
      error instanceof DeliveryError
        ? error.message
        : "Delivery quote is not available.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

function normaliseMethod(value?: string): DeliveryMethod {
  if (value === "express" || value === "EXPRESS") return "express";
  if (value === "pickup" || value === "PICKUP") return "pickup";
  return "standard";
}
