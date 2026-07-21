import { TicketStatus } from "@prisma/client";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { audit, notifyUser } from "@/server/notify";
import { requirePermission } from "@/server/security";
import { AdminEmpty } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/status-badge";
import { LockKeyhole, MessageSquare, Paperclip } from "lucide-react";

export const dynamic = "force-dynamic";

async function updateTicketAction(formData: FormData) {
  "use server";
  const admin = await requirePermission("orders.update");
  const ticketId = String(formData.get("ticketId"));
  const body = String(formData.get("body") || "").trim();
  const privateNote = String(formData.get("privateNote") || "").trim();
  const status = String(formData.get("status")) as TicketStatus;
  const priority = String(formData.get("priority") || "NORMAL");
  const assignedToId = String(formData.get("assignedToId") || "") || null;
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      priority,
      assignedToId,
      messages: body
        ? { create: { senderId: admin.id, body, public: true } }
        : undefined,
      internalNotes: privateNote
        ? { create: { authorId: admin.id, body: privateNote } }
        : undefined,
    },
  });
  if (body)
    await notifyUser({
      userId: ticket.userId,
      type: "SUPPORT_REPLY",
      title: "Support replied",
      body: ticket.subject,
    });
  await audit({
    userId: admin.id,
    action: privateNote ? "support.internal-note" : "support.update",
    entity: "SupportTicket",
    entityId: ticket.id,
    metadata: { status, priority, assignedToId },
  });
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; q?: string }>;
}) {
  await requirePermission("orders.view");
  const params = await searchParams;
  const [tickets, staff] = await Promise.all([
    prisma.supportTicket.findMany({
      where: {
        ...(params?.status ? { status: params.status as TicketStatus } : {}),
        ...(params?.q
          ? {
              OR: [
                { subject: { contains: params.q, mode: "insensitive" } },
                {
                  user: { email: { contains: params.q, mode: "insensitive" } },
                },
              ],
            }
          : {}),
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        internalNotes: { orderBy: { createdAt: "desc" }, take: 3 },
        attachments: true,
        user: true,
        assignedTo: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user.findMany({
      where: { roles: { some: {} } },
      select: { id: true, email: true, name: true },
      orderBy: { email: "asc" },
      take: 100,
    }),
  ]);
  return (
    <AdminShell>
      <AdminHero
        title="Support Tickets"
        description="Public replies, internal notes, assignment, priority and customer-safe conversation history."
      />
      <form className="admin-section flex flex-wrap gap-2 p-4">
        <input
          name="q"
          defaultValue={params?.q ?? ""}
          placeholder="Search tickets"
          className="h-11 min-w-56 flex-1 rounded-md border px-3"
        />
        <select
          name="status"
          defaultValue={params?.status ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">Any status</option>
          {Object.values(TicketStatus).map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <button className="admin-button bg-navy px-4 text-white">
          Filter
        </button>
      </form>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="kg-card overflow-hidden">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] p-5"><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{ticket.number}</p><strong className="mt-1 block text-lg text-navy">{ticket.subject}</strong><p className="mt-1 text-sm text-slate-500">{ticket.user?.email ?? "Guest"} · Assigned: {ticket.assignedTo?.email ?? "Unassigned"} · Updated {ticket.updatedAt.toLocaleString("en-BD")}</p></div><div className="flex gap-2"><StatusBadge>{ticket.priority}</StatusBadge><StatusBadge>{ticket.status}</StatusBadge></div></header>
            <div className="mt-3 space-y-2">
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={message.public ? "mx-5 max-w-3xl rounded-2xl bg-[var(--surface-soft)] p-4 text-sm" : "mx-5 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"}
                >
                  <p className={message.public ? "mb-1 flex items-center gap-2 text-xs font-black text-teal" : "mb-1 flex items-center gap-2 text-xs font-black text-amber-900"}>{message.public ? <MessageSquare className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />} {message.public ? "Public message" : "Private message"} · {message.createdAt.toLocaleString("en-BD")}</p><p className="whitespace-pre-wrap break-words">{message.body}</p>
                </div>
              ))}
            </div>
            {ticket.attachments.length ? <div className="mx-5 mt-3 flex flex-wrap gap-2">{ticket.attachments.filter(file => !file.deletedAt).map(file => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="admin-button admin-button-secondary max-w-full"><Paperclip className="h-4 w-4" /><span className="truncate">{file.fileName}</span></a>)}</div> : null}
            {ticket.internalNotes.length ? <aside className="mx-5 mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><h3 className="flex items-center gap-2 text-sm font-black text-amber-900"><LockKeyhole className="h-4 w-4" /> Internal notes — never shown to customers</h3><div className="mt-2 space-y-2">{ticket.internalNotes.map(note => <p key={note.id} className="text-sm text-amber-900">{note.body} <span className="text-xs text-amber-700">· {note.createdAt.toLocaleString("en-BD")}</span></p>)}</div></aside> : null}
            <form
              action={updateTicketAction}
              className="mt-4 grid gap-3 border-t border-[var(--border)] bg-slate-50/60 p-5 md:grid-cols-4"
            >
              <input type="hidden" name="ticketId" value={ticket.id} />
              <select
                name="status"
                defaultValue={ticket.status}
                className="h-10 rounded-md border px-2"
              >
                {Object.values(TicketStatus).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <select
                name="priority"
                defaultValue={ticket.priority}
                className="h-10 rounded-md border px-2"
              >
                <option>NORMAL</option>
                <option>HIGH</option>
                <option>URGENT</option>
              </select>
              <select
                name="assignedToId"
                defaultValue={ticket.assignedToId ?? ""}
                className="h-10 rounded-md border px-2"
              >
                <option value="">Unassigned</option>
                {staff.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
              <button className="admin-button admin-button-primary">
                Update
              </button>
              <input
                name="body"
                placeholder="Public reply"
                className="h-10 rounded-md border px-2 md:col-span-2"
              />
              <input
                name="privateNote"
                placeholder="Private internal note"
                className="h-10 rounded-md border px-2 md:col-span-2"
              />
            </form>
          </article>
        ))}
        {!tickets.length ? <AdminEmpty title="No support tickets found" description="No customer conversations match the current filters." /> : null}
      </div>
    </AdminShell>
  );
}
