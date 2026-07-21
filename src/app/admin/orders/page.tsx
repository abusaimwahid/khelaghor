import Link from "next/link";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { dhakaDate, money } from "@/lib/utils";
import { AdminEmpty, AdminPagination, AdminStat } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

const pageSize = 25;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    deliveryMethod?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  await requirePermission("orders.view");
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const page = Math.max(1, Number(params?.page ?? 1));
  const where = {
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { address: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(params?.status ? { status: params.status as OrderStatus } : {}),
    ...(params?.paymentStatus ? { paymentStatus: params.paymentStatus as PaymentStatus } : {}),
    ...(params?.paymentMethod ? { paymentMethod: params.paymentMethod } : {}),
    ...(params?.deliveryMethod ? { deliveryMethod: params.deliveryMethod } : {}),
    ...(params?.from || params?.to
      ? {
          createdAt: {
            ...(params.from ? { gte: new Date(params.from) } : {}),
            ...(params.to ? { lte: new Date(params.to) } : {}),
          },
        }
      : {}),
  };
  const [orders, total, summary] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        address: true,
        user: true,
        items: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const query = new URLSearchParams(Object.entries(params ?? {}).filter(([key, value]) => key !== "page" && value));

  return (
    <AdminShell>
      <AdminHero
        title="Order Operations"
        description="Search, filter, export, inspect and transition orders with stock-safe server-side rules."
      />
      <div className="grid gap-3 md:grid-cols-5">
        {Object.values(OrderStatus).slice(0, 5).map((status) => (
          <AdminStat key={status} label={status} value={summary.find((item) => item.status === status)?._count.status ?? 0} detail="Filtered results" />
        ))}
      </div>
      <form className="kg-card grid gap-3 p-4 lg:grid-cols-[1fr_repeat(4,160px)_auto]">
        <input name="q" defaultValue={q} placeholder="Order, name, phone or email" className="h-11 rounded-md border px-3" />
        <select name="status" defaultValue={params?.status ?? ""} className="h-11 rounded-md border px-3">
          <option value="">All statuses</option>
          {Object.values(OrderStatus).map((status) => <option key={status}>{status}</option>)}
        </select>
        <select name="paymentStatus" defaultValue={params?.paymentStatus ?? ""} className="h-11 rounded-md border px-3">
          <option value="">All payments</option>
          {Object.values(PaymentStatus).map((status) => <option key={status}>{status}</option>)}
        </select>
        <input name="paymentMethod" defaultValue={params?.paymentMethod ?? ""} placeholder="Payment" className="h-11 rounded-md border px-3" />
        <input name="deliveryMethod" defaultValue={params?.deliveryMethod ?? ""} placeholder="Delivery" className="h-11 rounded-md border px-3" />
        <button className="admin-button bg-navy px-4 text-white">Filter</button>
      </form>
      <div className="flex justify-end">
        <Link href={`/admin/orders/export?${query}`} className="admin-button admin-button-secondary">
          Export CSV
        </Link>
      </div>
      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Delivery</th>
                <th className="p-3">Courier</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[var(--border)]">
                  <td className="p-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-black text-navy">{order.number}</Link>
                    <p className="text-xs text-slate-500">{order.id.slice(0, 8)}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-bold">{order.address?.name ?? order.user?.name ?? "Guest"}</p>
                    <p className="text-xs text-slate-500">{order.phone || order.email}</p>
                  </td>
                  <td className="p-3">{dhakaDate(order.createdAt)}</td>
                  <td className="p-3">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td className="p-3 font-black">{money(Number(order.total))}</td>
                  <td className="p-3">{order.paymentMethod}<br /><StatusBadge className="mt-1">{order.paymentStatus}</StatusBadge></td>
                  <td className="p-3">{order.deliveryMethod}</td>
                  <td className="p-3">{order.courierProvider || "Not assigned"}<br /><span className="text-xs text-slate-500">{order.trackingId || ""}</span></td>
                  <td className="p-3"><StatusBadge>{order.status}</StatusBadge></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/orders/${order.id}`} className="admin-button admin-button-secondary">Open</Link>
                      <form action={updateOrderStatusAction} className="flex gap-2">
                        <input type="hidden" name="orderId" value={order.id} />
                        <select name="status" defaultValue={order.status} className="rounded-md border px-2">
                          {Object.values(OrderStatus).map((status) => <option key={status}>{status}</option>)}
                        </select>
                        <button className="admin-button admin-button-primary">Update</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!orders.length ? <AdminEmpty colSpan={10} title="No orders found" description="Adjust the current filters or date range to find another order." /> : null}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} pages={pages} href={(next) => { const nextQuery = new URLSearchParams(query); nextQuery.set("page", String(next)); return `/admin/orders?${nextQuery}`; }} />
      </section>
    </AdminShell>
  );
}
