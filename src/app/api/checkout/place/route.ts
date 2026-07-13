import { NextResponse } from "next/server";
import { getCurrentCart } from "@/server/cart";
import { createOrderFromCart } from "@/server/checkout";
import { assertRateLimit, currentUser } from "@/server/security";
import { checkoutSchema } from "@/server/validation";
import { logInternalError, toSafeMessage } from "@/server/errors";
import { createSslCommerzSession } from "@/server/payments/sslcommerz";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const base = new URL(request.url).origin;
  try {
    await assertRateLimit("checkout", 8);
    const formData = await request.formData();
    const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success)
      return NextResponse.redirect(
        `${base}/checkout?error=Invalid checkout details`,
        303,
      );
    const user = await currentUser();
    const cart = await getCurrentCart(user?.id);
    const order = await createOrderFromCart({
      cart,
      userId: user?.id,
      ...parsed.data,
    });
    if (parsed.data.paymentMethod === "SSLCOMMERZ") {
      const session = await createSslCommerzSession(order.id);
      return NextResponse.redirect(session.redirectUrl, 303);
    }
    return NextResponse.redirect(
      `${base}/order-confirmation?order=${order.number}`,
      303,
    );
  } catch (error) {
    logInternalError("checkout", error);
    const message = encodeURIComponent(toSafeMessage(error));
    return NextResponse.redirect(`${base}/checkout?error=${message}`, 303);
  }
}
