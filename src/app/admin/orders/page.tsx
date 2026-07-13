import { OrderStatus } from "@prisma/client";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requirePermission("orders.view");
  const orders = await prisma.order.findMany({ include: { items: true, statusHistory: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } });
  return (
    <section className="container py-10">
      <h1 className="mb-6 text-3xl font-black text-navy">Orders</h1>
      <div className="space-y-4">{orders.map((order) => <article key={order.id} className="rounded-lg bg-white p-5 shadow-sm"><div className="grid gap-3 md:grid-cols-5"><strong>{order.number}</strong><span>{order.phone}</span><span>{money(Number(order.total))}</span><span>{order.status}</span><form action={updateOrderStatusAction} className="flex gap-2"><input type="hidden" name="orderId" value={order.id} /><select name="status" className="rounded-md border border-[var(--border)] p-2">{Object.values(OrderStatus).map((s) => <option key={s}>{s}</option>)}</select><button className="rounded-md bg-coral px-3 font-bold text-white">Update</button></form></div><p className="mt-3 text-sm text-slate-500">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p><div className="mt-3 text-xs text-slate-500">{order.statusHistory.map((h) => <p key={h.id}>{h.toStatus}: {h.note}</p>)}</div></article>)}</div>
    </section>
  );
}
