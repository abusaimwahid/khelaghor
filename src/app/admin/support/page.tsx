import { TicketStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notify";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

async function replyAction(formData: FormData) {
  "use server";
  const admin = await requirePermission("orders.update");
  const ticketId = String(formData.get("ticketId"));
  const body = String(formData.get("body"));
  const status = String(formData.get("status")) as TicketStatus;
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status, messages: body ? { create: { senderId: admin.id, body } } : undefined },
  });
  await notifyUser({ userId: ticket.userId, type: "SUPPORT_UPDATED", title: "Support ticket updated", body: ticket.subject });
}

export default async function AdminSupportPage() {
  await requirePermission("orders.view");
  const tickets = await prisma.supportTicket.findMany({ include: { messages: true, user: true }, orderBy: { createdAt: "desc" } });
  return <section className="container py-10"><h1 className="mb-6 text-3xl font-black text-navy">Support Tickets</h1><div className="space-y-4">{tickets.map((ticket) => <article key={ticket.id} className="rounded-lg bg-white p-5 shadow-sm"><strong>{ticket.subject}</strong><p className="text-sm text-slate-500">{ticket.user?.email} • {ticket.status}</p>{ticket.messages.map((m) => <p key={m.id} className="mt-2 rounded-md bg-cream p-3">{m.body}</p>)}<form action={replyAction} className="mt-4 flex flex-wrap gap-2"><input type="hidden" name="ticketId" value={ticket.id} /><select name="status" className="rounded-md border p-2">{Object.values(TicketStatus).map((s) => <option key={s}>{s}</option>)}</select><input name="body" placeholder="Reply" className="min-w-64 flex-1 rounded-md border p-2" /><button className="rounded-md bg-coral px-4 font-bold text-white">Reply</button></form></article>)}</div></section>;
}
