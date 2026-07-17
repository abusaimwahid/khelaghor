import { RefundStatus } from "@prisma/client";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { money } from "@/lib/utils";
import { prisma } from "@/server/db";
import { completeRefund, createRefund } from "@/server/refunds";
import { requirePermission } from "@/server/security";

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
      include: { order: true, returnRequest: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.order.findMany({
      where: { total: { gt: 0 } },
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
        <h2 className="text-xl font-black text-navy">Create Manual Refund</h2>
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
                {order.number} • {money(Number(order.total))}
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
          <button className="rounded-md bg-coral px-4 font-black text-white">
            Approve
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
                  <td className="p-3">{refund.order.number}</td>
                  <td className="p-3">{money(Number(refund.amount))}</td>
                  <td className="p-3">{refund.method}</td>
                  <td className="p-3">{refund.status}</td>
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
                        <button className="rounded-md bg-navy px-3 font-bold text-white">
                          Complete
                        </button>
                      </form>
                    ) : (
                      "Done"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
