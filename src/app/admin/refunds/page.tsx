import { RefundStatus } from "@prisma/client";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { money } from "@/lib/utils";
import { prisma } from "@/server/db";
import { completeRefund, createRefund } from "@/server/refunds";
import { requirePermission } from "@/server/security";
import { AdminEmpty } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

async function createRefundAction(formData: FormData) {
  "use server";
  const admin = await requirePermission("orders.update");
  await createRefund({
    orderId: String(formData.get("orderId")),
    amount: Number(formData.get("amount")),
    method: String(formData.get("method") || "MANUAL"),
    reason: String(formData.get("reason") || ""),
    adminNote: String(formData.get("adminNote") || ""),
    createdById: admin.id,
    idempotencyKey: `manual-refund-${String(formData.get("orderId"))}-${String(formData.get("amount"))}-${Date.now()}`,
  });
}

async function completeRefundAction(formData: FormData) {
  "use server";
  const admin = await requirePermission("orders.update");
  await completeRefund({
    refundId: String(formData.get("refundId")),
    actorId: admin.id,
    externalTransactionId: String(formData.get("externalTransactionId") || ""),
  });
}

export default async function AdminRefundsPage() {
  await requirePermission("orders.view");
  const [refunds, orders] = await Promise.all([
    prisma.refund.findMany({
      include: { order: { include: { refunds: true } }, returnRequest: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.order.findMany({
      where: { total: { gt: 0 } },
      include: { refunds: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return (
    <AdminShell>
      <AdminHero
        title="Refunds"
        description="Manual refund records, partial refund accumulation and safe completion without inventory side effects."
      />
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Create manual refund</h2><p className="mt-2 text-sm text-slate-600">Server-side protection remains authoritative and rejects amounts above the refundable balance.</p>
        <form
          action={createRefundAction}
          className="mt-4 grid gap-3 md:grid-cols-5"
        >
          <select
            name="orderId"
            className="h-11 rounded-md border px-3 md:col-span-2"
          >
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
              {order.number} • maximum {money(Math.max(0, Number(order.total) - order.refunds.filter(refund => refund.status !== "FAILED" && refund.status !== "CANCELLED").reduce((sum, refund) => sum + Number(refund.amount), 0)))}
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="1"
            required
            placeholder="Amount"
            className="h-11 rounded-md border px-3"
          />
          <select name="method" className="h-11 rounded-md border px-3">
            <option>MANUAL</option>
            <option>BANK</option>
            <option>BKASH</option>
            <option>SSLCommerz</option>
          </select>
          <button className="admin-button admin-button-primary">
            Create refund
          </button>
          <input
            name="reason"
            placeholder="Reason"
            className="h-11 rounded-md border px-3 md:col-span-2"
          />
          <input
            name="adminNote"
            placeholder="Admin note"
            className="h-11 rounded-md border px-3 md:col-span-3"
          />
        </form>
      </section>
      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                {[
                  "Refund",
                  "Order",
                  "Amount",
                  "Method",
                  "Status",
                  "Created",
                  "Actions",
                ].map((head) => (
                  <th key={head} className="p-3">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id} className="border-t border-[var(--border)]">
                  <td className="p-3 font-black text-navy">{refund.number}</td>
                  <td className="p-3"><strong className="text-navy">{refund.order.number}</strong><p className="mt-1 text-xs text-slate-500">Order total {money(Number(refund.order.total))}</p></td>
                  <td className="p-3"><strong>{money(Number(refund.amount))}</strong><p className="mt-1 text-xs text-slate-500">Previously recorded {money(refund.order.refunds.filter(item => item.id !== refund.id && item.status !== "FAILED" && item.status !== "CANCELLED").reduce((sum, item) => sum + Number(item.amount), 0))}</p><p className="text-xs text-slate-500">Maximum remaining {money(Math.max(0, Number(refund.order.total) - refund.order.refunds.filter(item => item.status !== "FAILED" && item.status !== "CANCELLED").reduce((sum, item) => sum + Number(item.amount), 0)))}</p></td>
                  <td className="p-3">{refund.method}</td>
                  <td className="p-3"><StatusBadge>{refund.status}</StatusBadge></td>
                  <td className="p-3">
                    {refund.createdAt.toLocaleDateString("en-BD")}
                  </td>
                  <td className="p-3">
                    {refund.status !== RefundStatus.COMPLETED ? (
                      <form
                        action={completeRefundAction}
                        className="flex gap-2"
                      >
                        <input
                          type="hidden"
                          name="refundId"
                          value={refund.id}
                        />
                        <input
                          name="externalTransactionId"
                          placeholder="External ID"
                          className="h-10 rounded-md border px-2"
                        />
                        <button className="admin-button bg-navy text-white">
                          Complete
                        </button>
                      </form>
                    ) : (
                      "Done"
                    )}
                  </td>
                </tr>
              ))}
              {!refunds.length ? <AdminEmpty colSpan={7} title="No refunds recorded" description="Manual and return-linked refunds will appear here." /> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
