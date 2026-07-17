import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import {
  saveOrderNoteAction,
  updateOrderStatusAction,
} from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { dhakaDate, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("orders.view");
  const { id } = await params;
  const order = await prisma.order.findUniqueOrThrow({
    where: { id },
    include: {
      user: true,
      address: true,
      items: { include: { product: { include: { images: true } }, variant: true } },
      payments: { include: { transactions: true }, orderBy: { createdAt: "desc" } },
      refunds: true,
      returns: { include: { items: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  const productDiscount = order.items.reduce(
    (sum, item) => sum + Number(item.discount),
    0,
  );
  const paidAmount = order.payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const refundAmount = order.refunds.reduce(
    (sum, refund) => sum + Number(refund.amount),
    0,
  );

  return (
    <AdminShell>
      <AdminHero
        title={`Order ${order.number}`}
        description="Review customer, delivery, products, payments, timeline and internal operations notes."
      />
      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/orders/${order.id}/invoice`} className="rounded-md bg-navy px-4 py-3 font-black text-white">Invoice</Link>
        <Link href={`/admin/orders/${order.id}/packing-slip`} className="rounded-md border border-[var(--border)] bg-white px-4 py-3 font-black text-navy">Packing slip</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Customer">
          <p className="font-black text-navy">{order.address?.name ?? order.user?.name ?? "Guest customer"}</p>
          <p>{order.email ?? order.user?.email}</p>
          <p>{order.phone ?? order.address?.phone}</p>
          {order.user ? <Link href={`/admin/customers/${order.user.id}`} className="font-bold text-coral">Customer account</Link> : null}
        </Panel>
        <Panel title="Delivery">
          <p>{order.address?.line1}</p>
          <p>{order.address?.area}, {order.address?.district}, {order.address?.division}</p>
          <p>Method: {order.deliveryMethod}</p>
          <p>Zone: {order.deliveryZoneName || "Not captured"}</p>
          <p>
            Estimate:{" "}
            {order.deliveryEstimateMinDays !== null && order.deliveryEstimateMaxDays !== null
              ? `${order.deliveryEstimateMinDays}-${order.deliveryEstimateMaxDays} days`
              : "Not captured"}
          </p>
          <p>COD eligibility: {order.codAvailableSnapshot === null ? "Not captured" : order.codAvailableSnapshot ? "Available" : "Unavailable"}</p>
          <p>Rule: {order.deliveryRuleId || "Fallback/none"}</p>
          <p>Courier: {order.courierProvider || "Not assigned"}</p>
          <p>Tracking: {order.trackingId || "Not assigned"}</p>
          <p>Courier order ID: {order.courierOrderId || "Not assigned"}</p>
        </Panel>
      </div>

      <Panel title="Products">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Image</th>
                <th className="p-3">Product</th>
                <th className="p-3">Variant</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Line</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-[var(--border)]">
                  <td className="p-3">
                    <div className="h-14 w-14 overflow-hidden rounded-md bg-cream">
                      {item.product.images[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.images[0].url} alt="" className="h-full w-full object-contain" />
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-navy">{item.name}</td>
                  <td className="p-3">{item.variant?.name ?? "Base"}</td>
                  <td className="p-3">{item.sku}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">{money(Number(item.unitPrice))}</td>
                  <td className="p-3">{money(Number(item.discount))}</td>
                  <td className="p-3">{money(Number(item.unitPrice) * item.quantity - Number(item.discount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Financial Summary">
          <Line label="Subtotal" value={money(Number(order.subtotal))} />
          <Line label="Coupon discount" value={money(Number(order.discount))} />
          <Line label="Product discount" value={money(productDiscount)} />
          <Line label="Delivery fee" value={money(Number(order.deliveryFee))} />
          <Line label="Tax" value={money(0)} />
          <Line label="Total" value={money(Number(order.total))} strong />
          <Line label="Paid amount" value={money(paidAmount)} />
          <Line label="Refund amount" value={money(refundAmount)} />
        </Panel>
        <Panel title="Payment">
          <p>Method: {order.paymentMethod}</p>
          <p>Status: {order.paymentStatus}</p>
          {order.payments.map((payment) => (
            <div key={payment.id} className="mt-3 rounded-md bg-cream p-3">
              <p className="font-bold">{payment.provider} · {payment.status} · {money(Number(payment.amount))}</p>
              <p className="text-xs text-slate-500">Reference: {payment.reference || "Not set"}</p>
              <p className="text-xs text-slate-500">Events: {payment.transactions.length}</p>
            </div>
          ))}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Order Status Workflow">
          <form action={updateOrderStatusAction} className="grid gap-3">
            <input name="orderId" type="hidden" value={order.id} />
            <select name="status" defaultValue={order.status} className="h-11 rounded-md border px-3">
              {Object.values(OrderStatus).map((status) => <option key={status}>{status}</option>)}
            </select>
            <textarea name="note" rows={3} placeholder="Status note" className="rounded-md border p-3" />
            <button className="rounded-md bg-coral px-4 py-3 font-black text-white">Update status</button>
          </form>
          <div className="mt-5 space-y-3">
            {order.statusHistory.map((history) => (
              <div key={history.id} className="rounded-md bg-cream p-3">
                <p className="font-black text-navy">{history.toStatus}</p>
                <p className="text-xs text-slate-500">{dhakaDate(history.createdAt)} · {history.note || "Updated"}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Internal Notes">
          <form action={saveOrderNoteAction} className="grid gap-3">
            <input name="orderId" type="hidden" value={order.id} />
            <input name="courierProvider" defaultValue={order.courierProvider ?? ""} placeholder="Courier" className="h-11 rounded-md border px-3" />
            <input name="trackingId" defaultValue={order.trackingId ?? ""} placeholder="Tracking number" className="h-11 rounded-md border px-3" />
            <input name="courierOrderId" defaultValue={order.courierOrderId ?? ""} placeholder="Courier order ID" className="h-11 rounded-md border px-3" />
            <textarea name="deliveryNote" defaultValue={order.deliveryNote ?? ""} rows={3} placeholder="Delivery note" className="rounded-md border p-3" />
            <textarea name="internalNotes" defaultValue={order.internalNotes ?? ""} rows={5} placeholder="Private admin note" className="rounded-md border p-3" />
            <button className="rounded-md bg-navy px-4 py-3 font-black text-white">Save notes</button>
          </form>
        </Panel>
      </div>
    </AdminShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="kg-card p-6">
      <h2 className="mb-4 text-xl font-black text-navy">{title}</h2>
      <div className="space-y-2 text-sm font-semibold text-slate-600">{children}</div>
    </section>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between border-t pt-2 text-lg font-black text-navy" : "flex justify-between"}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
