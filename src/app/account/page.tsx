import Link from "next/link";
import {
  Heart,
  MapPin,
  Package,
  RotateCcw,
  Shield,
  Ticket,
  UserRound,
} from "lucide-react";
import { EmptyState } from "@/components/states";
import { products } from "@/data/catalog";
import { money } from "@/lib/utils";
import { requireUser } from "@/server/security";
import { prisma } from "@/server/db";

const nav = [
  "Dashboard",
  "Orders",
  "Track Order",
  "Wishlist",
  "Addresses",
  "Reviews",
  "Returns",
  "Support",
  "Profile",
  "Security",
  "Logout",
];

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const [orders, wishlist, addresses, tickets] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.wishlistItem.count({ where: { wishlist: { userId: user.id } } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.supportTicket.count({ where: { userId: user.id } }),
  ]);
  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
      <aside className="kg-card h-fit p-5 lg:sticky lg:top-36">
        <h1 className="mb-4 text-xl font-black text-navy">My Account</h1>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item}
              href="/account"
              className="block rounded-md px-3 py-2 font-bold text-slate-600 hover:bg-cream hover:text-navy"
            >
              {item}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="space-y-8">
        <section className="kg-card p-6">
          <p className="text-sm font-black uppercase text-teal">Welcome back</p>
          <h2 className="text-3xl font-black text-navy">
            {user.name ?? user.email}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Track orders, returns, saved addresses and support conversations
            from one protected place.
          </p>
        </section>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            [Package, "Recent orders", orders.length],
            [Heart, "Wishlist", wishlist],
            [MapPin, "Addresses", addresses],
            [Ticket, "Support tickets", tickets],
          ].map(([Icon, label, value]) => {
            const I = Icon as typeof Package;
            return (
              <div key={String(label)} className="kg-stat">
                <I className="h-6 w-6 text-coral" />
                <strong className="mt-3 block text-2xl text-navy">
                  {String(value)}
                </strong>
                <p className="text-sm text-slate-500">{String(label)}</p>
              </div>
            );
          })}
        </div>
        <section className="kg-card p-6">
          <h2 className="mb-4 text-xl font-black text-navy">Recent Orders</h2>
          {orders.length ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.number}
                  className="grid gap-3 rounded-md border border-[var(--border)] p-4 md:grid-cols-4"
                >
                  <strong>{order.number}</strong>
                  <span>{order.status}</span>
                  <span>{money(Number(order.total))}</span>
                  <Link href="/account/orders" className="font-bold text-coral">
                    Invoice / Reorder
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No orders yet"
              description="Your completed orders will appear here with invoice and reorder actions."
              href="/shop"
              action="Browse products"
              icon={Package}
            />
          )}
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            [RotateCcw, "Return Request"],
            [Shield, "Security"],
            [UserRound, "Profile Preferences"],
          ].map(([Icon, label]) => {
            const I = Icon as typeof Package;
            return (
              <div key={String(label)} className="kg-card p-5">
                <I className="h-6 w-6 text-teal" />
                <h3 className="mt-3 font-black text-navy">{String(label)}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Forms and workflows are wired for database-backed expansion.
                </p>
              </div>
            );
          })}
        </section>
        <section className="kg-card p-6">
          <h2 className="text-xl font-black text-navy">
            Review Purchased Items
          </h2>
          <p className="mt-2 text-slate-600">
            {products[0].name} is ready for a verified-purchase review once a
            matching completed order exists.
          </p>
        </section>
      </main>
    </div>
  );
}
