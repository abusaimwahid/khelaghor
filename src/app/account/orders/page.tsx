import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({ where: { userId: user.id }, include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" } });
  return <section className="container py-10"><h1 className="mb-6 text-3xl font-black text-navy">My Orders</h1><div className="space-y-4">{orders.map((order) => <article key={order.id} className="rounded-lg bg-white p-5 shadow-sm"><div className="grid gap-3 md:grid-cols-4"><strong>{order.number}</strong><span>{order.status}</span><span>{order.paymentStatus}</span><strong>{money(Number(order.total))}</strong></div><p className="mt-3 text-sm text-slate-500">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p><div className="mt-3 rounded-md bg-cream p-3 text-sm">{order.statusHistory.map((h) => <p key={h.id}>{h.toStatus}: {h.note ?? "Updated"}</p>)}</div></article>)}</div></section>;
}
