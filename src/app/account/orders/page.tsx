import Link from "next/link";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { dhakaDate, money } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/states";
import { FileText, Package, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      address: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section className="space-y-5 pb-10">
      <header className="kg-card flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
        <div><p className="storefront-eyebrow">Purchase history</p><h1 className="mt-1 text-3xl font-black text-navy">My orders</h1><p className="mt-2 text-sm text-slate-600">Track deliveries, review totals and access your invoices.</p></div>
        <div className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-black text-navy">{orders.length} {orders.length === 1 ? "order" : "orders"}</div>
      </header>
      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="kg-card overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] p-5">
              <div><p className="text-xs font-black uppercase tracking-wide text-slate-500">Order number</p><strong className="mt-1 block text-lg text-navy">{order.number}</strong><p className="mt-1 text-sm text-slate-500">Placed {dhakaDate(order.createdAt)}</p></div>
              <strong className="text-xl text-navy">{money(Number(order.total))}</strong>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap gap-2"><StatusBadge>{order.status}</StatusBadge><StatusBadge>{order.paymentStatus}</StatusBadge>{order.trackingId ? <StatusBadge>TRACKING ACTIVE</StatusBadge> : null}</div>
                <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-soft)] text-coral"><Package className="h-5 w-5" /></span><div className="min-w-0"><p className="font-bold text-navy">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p><p className="line-clamp-2 text-sm leading-6 text-slate-600">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</p></div></div>
                <p className="text-sm text-slate-500">Delivery: {[order.address?.area, order.address?.district].filter(Boolean).join(", ") || order.deliveryZoneName || "Address on order"}{order.trackingId ? ` · Tracking ${order.trackingId}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end"><Link href={`/account/orders/${order.id}/invoice`} className="kg-button kg-button-secondary"><FileText className="h-4 w-4" /> Invoice</Link><Link href={`/account/orders/${order.id}`} className="kg-button kg-button-primary">View details <ArrowRight className="h-4 w-4" /></Link></div>
            </div>
          </article>
        ))}
        {!orders.length ? <EmptyState title="No orders yet" description="When you place an order, its delivery and payment progress will appear here." href="/shop" action="Start shopping" /> : null}
      </div>
    </section>
  );
}
