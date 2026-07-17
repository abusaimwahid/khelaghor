import { TicketStatus } from "@prisma/client";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { audit, notifyUser } from "@/server/notify";
import { requirePermission } from "@/server/security";

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
      <form className="flex flex-wrap gap-2">
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
        <button className="rounded-md bg-navy px-4 font-black text-white">
          Filter
        </button>
      </form>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="kg-card p-5">
            <strong className="text-navy">{ticket.subject}</strong>
            <p className="text-sm text-slate-500">
              {ticket.number} • {ticket.user?.email ?? "Guest"} •{" "}
              {ticket.status} • {ticket.priority} • Assigned:{" "}
              {ticket.assignedTo?.email ?? "None"}
            </p>
            <div className="mt-3 space-y-2">
              {ticket.messages.map((message) => (
                <p
                  key={message.id}
                  className={
                    message.public
                      ? "rounded-md bg-cream p-3 text-sm"
                      : "rounded-md bg-slate-100 p-3 text-sm"
                  }
                >
                  {message.body}
                </p>
              ))}
            </div>
            <form
              action={updateTicketAction}
              className="mt-4 grid gap-2 md:grid-cols-4"
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
              <button className="rounded-md bg-coral px-4 font-bold text-white">
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
      </div>
    </AdminShell>
  );
}
