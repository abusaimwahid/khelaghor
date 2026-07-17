import { submitReturnAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { UploadField } from "@/components/forms/upload-field";

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
      items: { include: { orderItem: true } },
      history: { orderBy: { createdAt: "asc" } },
      evidence: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section className="container grid gap-8 py-10 lg:grid-cols-[380px_1fr]">
      <form action={submitReturnAction} className="kg-card h-fit p-6">
        <h1 className="text-2xl font-black text-navy">Return Request</h1>
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
        <button className="mt-4 rounded-md bg-coral px-5 py-3 font-black text-white">
          Submit
        </button>
      </form>
      <div className="space-y-4">
        {returns.map((ret) => (
          <article key={ret.id} className="kg-card p-5">
            <strong className="text-navy">{ret.number}</strong>
            <p className="text-sm font-bold text-slate-500">
              {ret.status} • {ret.reason} •{" "}
              {ret.resolution ?? "No resolution selected"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {ret.items
                .map((item) => `${item.quantity}× ${item.orderItem.name}`)
                .join(", ")}
            </p>
            <div className="mt-3 space-y-1 rounded-md bg-cream p-3 text-sm text-slate-600">
              {ret.history.map((row) => (
                <p key={row.id}>
                  {row.createdAt.toLocaleString("en-BD")} • {row.toStatus}{" "}
                  {row.publicNote ? `• ${row.publicNote}` : ""}
                </p>
              ))}
            </div>
          </article>
        ))}
        {!returns.length ? (
          <p className="kg-card p-5 text-sm font-semibold text-slate-500">
            No return requests yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
