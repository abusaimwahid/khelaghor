import Link from "next/link";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { dhakaDate, money } from "@/lib/utils";

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
    <section className="container py-10">
      <h1 className="mb-6 text-3xl font-black text-navy">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-5">
              <strong>{order.number}</strong>
              <span>{dhakaDate(order.createdAt)}</span>
              <span>{order.status}</span>
              <span>{order.paymentStatus}</span>
              <strong>{money(Number(order.total))}</strong>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Delivery: {order.address?.area}, {order.address?.district}
              {order.trackingId ? ` · Tracking ${order.trackingId}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/account/orders/${order.id}/invoice`} className="rounded-md bg-navy px-4 py-2 font-bold text-white">
                Invoice
              </Link>
              <Link href={`/account/support?order=${order.id}`} className="rounded-md border px-4 py-2 font-bold text-navy">
                Support
              </Link>
            </div>
            <div className="mt-3 rounded-md bg-cream p-3 text-sm">
              {order.statusHistory.map((history) => (
                <p key={history.id}>
                  {history.toStatus}: {history.note ?? "Updated"}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
