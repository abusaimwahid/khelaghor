import { notFound } from "next/navigation";
import { replySupportTicketAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: {
        where: { public: true },
        orderBy: { createdAt: "asc" },
        include: { sender: true },
      },
      attachments: { where: { deletedAt: null } },
    },
  });
  if (!ticket) notFound();
  return (
    <section className="container max-w-3xl space-y-5 py-10">
      <header className="kg-card p-6">
        <h1 className="text-3xl font-black text-navy">{ticket.subject}</h1>
        <p className="text-sm font-bold text-slate-500">
          {ticket.number} • {ticket.status} • {ticket.priority}
        </p>
      </header>
      <section className="kg-card space-y-3 p-6">
        {ticket.messages.map((message) => (
          <article key={message.id} className="rounded-md bg-cream p-3">
            <p className="text-xs font-bold text-slate-500">
              {message.sender?.email ?? "Support"} •{" "}
              {message.createdAt.toLocaleString("en-BD")}
            </p>
            <p className="mt-1">{message.body}</p>
          </article>
        ))}
      </section>
      <form action={replySupportTicketAction} className="kg-card p-6">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <textarea
          name="body"
          required
          className="kg-input min-h-28"
          placeholder="Reply to support"
        />
        <button className="mt-3 rounded-md bg-coral px-5 py-3 font-black text-white">
          Reply
        </button>
      </form>
    </section>
  );
}
