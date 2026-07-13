"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateCartItem } from "@/server/cart";
import { currentUser } from "@/server/security";
import { cartUpdateSchema } from "@/server/validation";
import { logInternalError } from "@/server/errors";

export async function updateCartAction(formData: FormData) {
  const user = await currentUser();
  const parsed = cartUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/cart?error=Invalid cart item");
  try {
    await updateCartItem({
      userId: user?.id,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId || undefined,
      quantity: parsed.data.quantity,
      mode: "set",
    });
  } catch (error) {
    logInternalError("cart-update", error);
    redirect("/cart?error=The selected item is no longer available.");
  }
  revalidatePath("/cart");
}

export async function addToCartAction(formData: FormData) {
  const user = await currentUser();
  const parsed = cartUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/cart?error=Invalid cart item");
  try {
    await updateCartItem({
      userId: user?.id,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId || undefined,
      quantity: parsed.data.quantity,
      mode: "add",
    });
  } catch (error) {
    logInternalError("cart-add", error);
    redirect("/cart?error=The selected item is no longer available.");
  }
  redirect("/cart");
}
