import crypto from "node:crypto";
import Link from "next/link";
import { CreditCard, ShieldCheck, Truck } from "lucide-react";
import { BangladeshAddressSelector } from "@/components/forms/bangladesh-address-selector";
import { CouponBox } from "@/components/forms/coupon-box";
import { getCurrentCart, secureCartTotals } from "@/server/cart";
import { currentUser } from "@/server/security";
import { money } from "@/lib/utils";
import { CheckoutSubmitButton } from "@/components/forms/checkout-submit-button";
import { EmptyState } from "@/components/states";
import { getDivisions } from "@/data/bangladesh-locations";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await currentUser();
  const cart = await getCurrentCart(user?.id);
  const totals = secureCartTotals(cart);
  const idempotencyKey = crypto.randomBytes(16).toString("hex");
  const divisions = getDivisions();
  return (
    <div className="container storefront-page grid gap-8 lg:grid-cols-[1fr_400px]">
      <form
        action="/api/checkout/place"
        method="post"
        className="kg-card rounded-[var(--radius-panel)] p-5 md:p-8"
      >
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <div className="mb-6">
          <p className="text-sm font-black uppercase text-teal">Secure order</p>
          <h1 className="storefront-title mt-1">Checkout</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Delivery details, payment method and stock are validated on the
            server before confirmation.
          </p>
        </div>
        {!cart.items.length ? (
          <div className="mb-6">
            <EmptyState
              title="Your cart needs an item first"
              description="Add at least one product before placing an order."
              href="/shop"
              action="Shop products"
            />
          </div>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2">
          <label className="font-bold text-navy">
            Full name
            <input
              name="fullName"
              defaultValue={user?.name ?? ""}
              required
              className="kg-input mt-2"
            />
          </label>
          <label className="font-bold text-navy">
            Phone number
            <input
              name="phone"
              defaultValue={user?.phone ?? ""}
              required
              className="kg-input mt-2"
            />
          </label>
          <label className="font-bold text-navy">
            Email
            <input
              name="email"
              type="email"
              defaultValue={user?.email ?? ""}
              className="kg-input mt-2"
            />
          </label>
          <CouponBox />
        </div>
        <BangladeshAddressSelector divisions={divisions} />
        <label className="mt-6 flex gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-peach)] p-5 text-sm font-semibold text-slate-700">
          <input type="checkbox" name="termsAccepted" required />
          <span>
            I agree to the{" "}
            <Link
              href="/terms-and-conditions"
              className="font-black text-coral"
            >
              terms and conditions
            </Link>
            , return policy and delivery validation process.
          </span>
        </label>
        <CheckoutSubmitButton disabled={cart.items.length === 0} />
      </form>
      <aside className="kg-card h-fit rounded-[var(--radius-panel)] p-7 lg:sticky lg:top-40">
        <p className="storefront-eyebrow">Order summary</p>
        <h2 className="mt-1 text-2xl font-black text-navy">Review</h2>
        {cart.items.map((item) => (
          <p key={item.id} className="mt-3 text-sm text-slate-600">
            {item.quantity} × {item.product.name}
          </p>
        ))}
        <p className="mt-4 flex justify-between">
          <span>Subtotal</span>
          <strong>{money(totals.subtotal)}</strong>
        </p>
        <p className="mt-2 flex justify-between">
          <span>Delivery</span>
          <strong>Calculated by address</strong>
        </p>
        <p className="mt-4 flex justify-between text-lg">
          <span>Items total</span>
          <strong>{money(totals.subtotal)}</strong>
        </p>
        <div className="mt-6 space-y-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-mint)] p-4 text-sm font-semibold text-slate-700">
          <p className="flex gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-teal" /> Secure
            server-side order validation
          </p>
          <p className="flex gap-2">
            <Truck className="h-5 w-5 shrink-0 text-teal" /> Delivery fee
            calculated before confirmation
          </p>
          <p className="flex gap-2">
            <CreditCard className="h-5 w-5 shrink-0 text-teal" /> COD works now;
            gateways need credentials
          </p>
        </div>
      </aside>
    </div>
  );
}
