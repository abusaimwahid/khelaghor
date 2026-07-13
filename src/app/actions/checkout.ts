"use server";

import { redirect } from "next/navigation";
import { getCurrentCart } from "@/server/cart";
import { createOrderFromCart } from "@/server/checkout";
import { assertRateLimit, currentUser } from "@/server/security";
import { checkoutSchema } from "@/server/validation";
import { logInternalError, toSafeMessage } from "@/server/errors";

export async function checkoutAction(formData: FormData) {
  await assertRateLimit("checkout", 8);
  const user = await currentUser();
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/checkout?error=Invalid checkout details");
  const cart = await getCurrentCart(user?.id);
  try {
    const order = await createOrderFromCart({ cart, userId: user?.id, ...parsed.data });
    redirect(`/order-confirmation?order=${order.number}`);
  } catch (error) {
    logInternalError("checkout-action", error);
    redirect(`/checkout?error=${encodeURIComponent(toSafeMessage(error))}`);
  }
}
