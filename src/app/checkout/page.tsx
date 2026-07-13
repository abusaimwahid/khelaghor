import crypto from "node:crypto";
import Link from "next/link";
import { CreditCard, ShieldCheck, Truck } from "lucide-react";
import { getCurrentCart, secureCartTotals } from "@/server/cart";
import { currentUser } from "@/server/security";
import { money } from "@/lib/utils";
import { CheckoutSubmitButton } from "@/components/forms/checkout-submit-button";
import { EmptyState } from "@/components/states";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await currentUser();
  const cart = await getCurrentCart(user?.id);
  const totals = secureCartTotals(cart);
  const idempotencyKey = crypto.randomBytes(16).toString("hex");
  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
      <form
        action="/api/checkout/place"
        method="post"
        className="kg-card p-5 md:p-6"
      >
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <div className="mb-6">
          <p className="text-sm font-black uppercase text-teal">Secure order</p>
          <h1 className="text-3xl font-black text-navy">Checkout</h1>
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
        <div className="grid gap-4 md:grid-cols-2">
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
          <label className="font-bold text-navy">
            Division
            <input name="division" required className="kg-input mt-2" />
          </label>
          <label className="font-bold text-navy">
            District
            <input name="district" required className="kg-input mt-2" />
          </label>
          <label className="font-bold text-navy">
            Area
            <input name="area" required className="kg-input mt-2" />
          </label>
          <label className="font-bold text-navy">
            Postal code
            <input name="postalCode" className="kg-input mt-2" />
          </label>
          <label className="font-bold text-navy">
            Landmark
            <input name="landmark" className="kg-input mt-2" />
          </label>
          <label className="font-bold text-navy md:col-span-2">
            Full address
            <textarea
              name="address"
              required
              className="kg-input mt-2 min-h-28"
            />
          </label>
          <label className="font-bold text-navy">
            Coupon
            <input
              name="couponCode"
              placeholder="WELCOME10"
              className="kg-input mt-2"
            />
          </label>
        </div>
        <h2 className="mb-3 mt-8 text-xl font-black text-navy">
          Delivery Method
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["STANDARD", "Standard Delivery"],
            ["EXPRESS", "Express Delivery"],
            ["SAME_DAY", "Same-Day Delivery placeholder"],
            ["PICKUP", "Store Pickup placeholder"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex gap-3 rounded-md border border-[var(--border)] p-4 font-bold text-navy"
            >
              <input
                type="radio"
                name="deliveryMethod"
                value={value}
                defaultChecked={value === "STANDARD"}
              />{" "}
              {label}
            </label>
          ))}
        </div>
        <h2 className="mb-3 mt-8 text-xl font-black text-navy">Payment</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["COD", "Cash on Delivery"],
            ["SSLCOMMERZ", "SSLCommerz online payment"],
            ["BKASH", "bKash placeholder"],
            ["NAGAD", "Nagad placeholder"],
            ["ROCKET", "Rocket placeholder"],
            ["CARD", "Card payment placeholder"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex gap-3 rounded-md border border-[var(--border)] p-4 font-bold text-navy"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={value}
                defaultChecked={value === "COD"}
              />{" "}
              {label}
            </label>
          ))}
        </div>
        <label className="mt-6 flex gap-3 rounded-md bg-cream p-4 text-sm font-semibold text-slate-700">
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
      <aside className="kg-card h-fit p-6 lg:sticky lg:top-36">
        <h2 className="text-xl font-black text-navy">Review</h2>
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
          <strong>{money(totals.delivery)}</strong>
        </p>
        <p className="mt-4 flex justify-between text-lg">
          <span>Total</span>
          <strong>{money(totals.total)}</strong>
        </p>
        <div className="mt-6 space-y-3 rounded-lg bg-cream p-4 text-sm font-semibold text-slate-700">
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
