import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { updateCartAction } from "@/app/actions/cart";
import { EmptyState } from "@/components/states";
import { getCurrentCart, secureCartTotals } from "@/server/cart";
import { currentUser } from "@/server/security";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await currentUser();
  const cart = await getCurrentCart(user?.id);
  const totals = secureCartTotals(cart);
  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
      <section className="kg-card p-5 md:p-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-teal">
              Review items
            </p>
            <h1 className="text-3xl font-black text-navy">Shopping Cart</h1>
          </div>
          <Link href="/shop" className="kg-button kg-button-secondary">
            Continue shopping
          </Link>
        </div>
        <div className="space-y-4">
          {cart.items.length ? (
            cart.items.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 rounded-lg border border-[var(--border)] p-4 md:grid-cols-[1fr_140px_120px]"
              >
                <div>
                  <strong className="text-navy">{item.product.name}</strong>
                  <p className="text-sm text-slate-500">
                    {item.product.brand?.name ?? "KhelaGhor"} • SKU{" "}
                    {item.product.sku}
                  </p>
                </div>
                <form action={updateCartAction} className="flex gap-2">
                  <input
                    type="hidden"
                    name="productId"
                    value={item.productId}
                  />
                  <input
                    type="hidden"
                    name="variantId"
                    value={item.variantId ?? ""}
                  />
                  <input
                    name="quantity"
                    type="number"
                    defaultValue={item.quantity}
                    min={0}
                    className="kg-input h-11 w-20"
                    aria-label={`Quantity for ${item.product.name}`}
                  />
                  <button className="kg-button kg-button-dark min-h-11 px-3 text-sm">
                    Save
                  </button>
                </form>
                <strong className="text-right text-navy">
                  {money(
                    Number(
                      item.product.salePrice ?? item.product.regularPrice,
                    ) * item.quantity,
                  )}
                </strong>
              </div>
            ))
          ) : (
            <EmptyState
              title="Your cart is empty"
              description="Browse toys, books and baby essentials, then come back here when something feels just right."
              href="/shop"
              action="Start shopping"
              icon={ShoppingBag}
            />
          )}
        </div>
      </section>
      <aside className="kg-card h-fit p-6 lg:sticky lg:top-36">
        <h2 className="text-xl font-black text-navy">Order Summary</h2>
        <div className="mt-4 space-y-3 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <strong>{money(totals.subtotal)}</strong>
          </p>
          <p className="flex justify-between">
            <span>Delivery</span>
            <strong>{money(totals.delivery)}</strong>
          </p>
          <p className="flex justify-between text-lg">
            <span>Total</span>
            <strong>{money(totals.total)}</strong>
          </p>
        </div>
        <div className="mt-5 rounded-full bg-cream p-1">
          <div
            className="h-3 rounded-full bg-teal"
            style={{
              width: `${Math.min(100, (totals.subtotal / 3000) * 100)}%`,
            }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {totals.subtotal >= 3000
            ? "Free delivery unlocked."
            : `${money(3000 - totals.subtotal)} more for free delivery.`}
        </p>
        <Link
          href={cart.items.length ? "/checkout" : "/shop"}
          className={`kg-button mt-6 w-full ${cart.items.length ? "kg-button-primary" : "kg-button-secondary"}`}
        >
          {cart.items.length ? "Checkout" : "Shop products"}
        </Link>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Stock, pricing and coupons are revalidated on the server before the
          order is placed.
        </p>
      </aside>
    </div>
  );
}
