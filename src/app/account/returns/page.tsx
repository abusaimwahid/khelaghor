import { submitReturnAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { UploadField } from "@/components/forms/upload-field";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/states";
import { dhakaDate, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const user = await requireUser();
  const items = await prisma.orderItem.findMany({
    where: {
      order: { userId: user.id, status: { in: ["DELIVERED", "RETURNED"] } },
    },
    include: { order: true },
    orderBy: { order: { createdAt: "desc" } },
  });
  const returns = await prisma.returnRequest.findMany({
    where: { userId: user.id },
    include: {
      order: { include: { refunds: true } }, items: { include: { orderItem: true } },
      history: { orderBy: { createdAt: "asc" } },
      evidence: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section className="grid gap-5 pb-10 xl:grid-cols-[360px_1fr]">
      <form action={submitReturnAction} className="kg-card h-fit p-6">
        <p className="storefront-eyebrow">Eligible delivered items</p><h1 className="mt-1 text-2xl font-black text-navy">Request a return</h1><p className="mt-2 text-sm leading-6 text-slate-600">Items are inspected before inventory and refund decisions are completed.</p>
        <label className="mt-4 block font-bold text-navy">
          Order item
          <select name="orderItemId" className="kg-input mt-2">
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.order.number} • {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block font-bold text-navy">
          Quantity
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue="1"
            className="kg-input mt-2"
          />
        </label>
        <label className="mt-4 block font-bold text-navy">
          Reason
          <select name="reason" className="kg-input mt-2">
            {[
              "Damaged product",
              "Wrong product",
              "Missing parts",
              "Size problem",
              "Quality issue",
              "Product not as described",
              "Changed mind",
              "Other",
            ].map((reason) => (
              <option key={reason}>{reason}</option>
            ))}
          </select>
        </label>
        <label className="mt-4 block font-bold text-navy">
          Requested resolution
          <select name="resolution" className="kg-input mt-2">
            <option>Replacement</option>
            <option>Refund</option>
            <option>Store credit</option>
          </select>
        </label>
        <textarea
          name="description"
          placeholder="Details"
          className="kg-input mt-4 min-h-28"
        />
        <UploadField name="evidenceUrls" purpose="return-evidence" label="Evidence (images or PDF)" accept="image/*,application/pdf" />
        <button disabled={!items.length} className="kg-button kg-button-primary mt-4 w-full disabled:cursor-not-allowed disabled:bg-slate-300">
          Submit
        </button>
      </form>
      <div className="space-y-4">
        {returns.map((ret) => (
          <article key={ret.id} className="kg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">Return {ret.number}</p><strong className="mt-1 block text-navy">Order {ret.order.number}</strong></div><StatusBadge>{ret.status}</StatusBadge></div>
            <p className="mt-3 text-sm font-bold text-slate-600">{ret.reason} · {ret.resolution ?? "Resolution pending"}</p>
            <p className="mt-2 text-sm text-slate-600">
              {ret.items
                .map((item) => `${item.quantity}× ${item.orderItem.name}`)
                .join(", ")}
            </p>
            {ret.inspectionResult ? <p className="mt-3 rounded-xl bg-[var(--surface-soft)] p-3 text-sm text-slate-700"><strong className="text-navy">Inspection:</strong> {ret.inspectionResult}</p> : null}
            <ol className="mt-4 space-y-3 border-l-2 border-teal/20 pl-4">{ret.history.map((row) => <li key={row.id} className="relative text-sm text-slate-600"><span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal" /><div className="flex flex-wrap items-center gap-2"><StatusBadge>{row.toStatus}</StatusBadge><span className="text-xs">{dhakaDate(row.createdAt)}</span></div>{row.publicNote ? <p className="mt-1">{row.publicNote}</p> : null}</li>)}</ol>
            {ret.evidence.length ? <div className="mt-4 flex flex-wrap gap-2">{ret.evidence.map((file, index) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold text-coral">Evidence {index + 1}{file.fileName ? ` · ${file.fileName}` : ""}</a>)}</div> : null}
            {ret.order.refunds.length ? <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><strong>Refund summary</strong>{ret.order.refunds.map(refund => <p key={refund.id} className="mt-1">{money(Number(refund.amount) + Number(refund.deliveryFeeAmount))} · {refund.status}</p>)}</div> : null}
          </article>
        ))}
        {!returns.length ? <EmptyState title="No return requests" description="Eligible delivered items can be submitted from the form on this page." /> : null}
      </div>
    </section>
  );
}
