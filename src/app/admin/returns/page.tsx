import { ReturnStatus } from "@prisma/client";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { inspectReturn, transitionReturn } from "@/server/returns";
import { requirePermission } from "@/server/security";
import { AdminEmpty } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/status-badge";
import { Paperclip } from "lucide-react";

export const dynamic = "force-dynamic";

async function updateReturnAction(formData: FormData) {
  "use server";
  const admin = await requirePermission("orders.update");
  await transitionReturn({
    returnId: String(formData.get("returnId")),
    status: String(formData.get("status")) as ReturnStatus,
    actorId: admin.id,
    publicNote: String(formData.get("publicNote") ?? ""),
    privateAdminNote: String(formData.get("privateAdminNote") ?? ""),
  });
}

async function inspectReturnAction(formData: FormData) {
  "use server";
  const admin = await requirePermission("orders.update");
  const result = String(formData.get("result"));
  const note = String(formData.get("note") ?? "");
  if (!note.trim()) throw new Error("Inspection note is required.");
  await inspectReturn({
    returnId: String(formData.get("returnId")),
    actorId: admin.id,
    resellable: result === "resellable",
    note,
  });
}

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    reason?: string;
    resolution?: string;
    q?: string;
  }>;
}) {
  await requirePermission("orders.view");
  const params = await searchParams;
  const returns = await prisma.returnRequest.findMany({
    where: {
      ...(params?.status ? { status: params.status as ReturnStatus } : {}),
      ...(params?.reason
        ? { reason: { contains: params.reason, mode: "insensitive" } }
        : {}),
      ...(params?.resolution ? { resolution: params.resolution } : {}),
      ...(params?.q
        ? {
            OR: [
              { number: { contains: params.q, mode: "insensitive" } },
              {
                order: { number: { contains: params.q, mode: "insensitive" } },
              },
            ],
          }
        : {}),
    },
    include: {
      order: { include: { user: true } },
      items: { include: { orderItem: true } },
      history: { orderBy: { createdAt: "desc" }, take: 3 },
      evidence: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <AdminShell>
      <AdminHero
        title="Returns"
        description="Review return requests, receive products, inspect inventory destination and keep a customer-visible timeline."
      />
      <form className="admin-section flex flex-wrap gap-2 p-4">
        <input
          name="q"
          defaultValue={params?.q ?? ""}
          placeholder="Search return/order"
          className="h-11 min-w-56 flex-1 rounded-md border px-3"
        />
        <select
          name="status"
          defaultValue={params?.status ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">Any status</option>
          {Object.values(ReturnStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          name="reason"
          defaultValue={params?.reason ?? ""}
          placeholder="Reason"
          className="h-11 rounded-md border px-3"
        />
        <select
          name="resolution"
          defaultValue={params?.resolution ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">Any resolution</option>
          <option>Replacement</option>
          <option>Refund</option>
          <option>Store credit</option>
        </select>
        <button className="admin-button bg-navy px-4 text-white">
          Filter
        </button>
      </form>
      <div className="space-y-4">
        {returns.map((ret) => (
          <article key={ret.id} className="kg-card overflow-hidden">
            <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong className="text-lg text-navy">{ret.number}</strong>
                <p className="text-sm text-slate-500">
                  {ret.order.number} • {ret.order.user?.email ?? "Guest"}
                </p>
                <StatusBadge className="mt-2">{ret.status}</StatusBadge>
                <p className="mt-1 text-sm">
                  {ret.reason} • {ret.resolution ?? "No resolution selected"}
                </p>
                <p className="text-sm text-slate-500">
                  {ret.items
                    .map((item) => `${item.quantity}× ${item.orderItem.name}`)
                    .join(", ")}
                </p>
              </div>
              <form
                action={updateReturnAction}
                className="flex flex-wrap gap-2"
              >
                <input type="hidden" name="returnId" value={ret.id} />
                <select name="status" className="h-10 rounded-md border px-2">
                  {Object.values(ReturnStatus).map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <input
                  name="publicNote"
                  placeholder="Public note"
                  className="h-10 rounded-md border px-2"
                />
                <input
                  name="privateAdminNote"
                  placeholder="Private note"
                  className="h-10 rounded-md border px-2"
                />
                <button className="admin-button admin-button-primary">
                  Update
                </button>
              </form>
            </div>
            {ret.evidence.length ? <div className="mt-4 flex flex-wrap gap-2">{ret.evidence.map((file, index) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="admin-button admin-button-secondary max-w-full"><Paperclip className="h-4 w-4" /><span className="truncate">{file.fileName || `Evidence ${index + 1}`}</span></a>)}</div> : null}
            </div><form
              action={inspectReturnAction}
              className="flex flex-wrap gap-2 border-y border-[var(--border)] bg-amber-50 p-4"
            >
              <input type="hidden" name="returnId" value={ret.id} />
              <select name="result" className="h-10 rounded-md border px-2">
                <option value="resellable">Resellable</option>
                <option value="damaged">Damaged</option>
              </select>
              <input
                name="note"
                required
                placeholder="Inspection note required"
                className="h-10 min-w-64 flex-1 rounded-md border px-2"
              />
              <button className="admin-button bg-navy text-white">
                Save inspection
              </button>
            </form>
            <div className="space-y-3 p-5 text-xs text-slate-500">
              {ret.history.map((row) => (
                <p key={row.id} className="border-l-2 border-teal/30 pl-3">
                  <StatusBadge>{row.toStatus}</StatusBadge> <span className="ml-2">{row.createdAt.toLocaleString("en-BD")}</span>{row.publicNote ? <span className="mt-1 block text-sm">{row.publicNote}</span> : null}
                </p>
              ))}
            </div>
          </article>
        ))}
        {!returns.length ? <AdminEmpty title="No returns found" description="No return requests match the current operational filters." /> : null}
      </div>
    </AdminShell>
  );
}
