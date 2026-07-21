import { notFound } from "next/navigation";
import { replySupportTicketAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { Paperclip, Send } from "lucide-react";

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
    <section className="mx-auto max-w-3xl space-y-5 pb-10">
      <header className="kg-card p-6">
        <Link href="/account/support" className="text-sm font-black text-coral">← All tickets</Link>
        <h1 className="text-3xl font-black text-navy">{ticket.subject}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-slate-500">{ticket.number}</span><StatusBadge>{ticket.status}</StatusBadge><StatusBadge>{ticket.priority}</StatusBadge></div>
      </header>
      <section className="kg-card space-y-3 p-6">
        {ticket.messages.map((message) => (
          <article key={message.id} className={`max-w-[90%] rounded-[18px] p-4 ${message.senderId === user.id ? "ml-auto rounded-br-md bg-navy text-white" : "mr-auto rounded-bl-md bg-[var(--surface-soft)] text-navy"}`}>
            <p className="text-xs font-bold text-slate-500">
              {message.senderId === user.id ? "You" : "KhelaGhor support"} •{" "}
              {message.createdAt.toLocaleString("en-BD")}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words">{message.body}</p>
          </article>
        ))}
        {!ticket.messages.length ? <p className="text-sm text-slate-500">No public messages are available in this conversation.</p> : null}
        {ticket.attachments.length ? <div className="border-t border-[var(--border)] pt-4"><p className="text-sm font-black text-navy">Attachments</p><div className="mt-2 flex flex-wrap gap-2">{ticket.attachments.map(file => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold text-coral"><Paperclip className="h-4 w-4 shrink-0" /><span className="truncate">{file.fileName}</span></a>)}</div></div> : null}
      </section>
      <form action={replySupportTicketAction} className="kg-card p-6">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <textarea
          name="body"
          required
          className="kg-input min-h-28"
          placeholder="Reply to support"
        />
        <button className="kg-button kg-button-primary mt-3 w-full sm:w-auto">
          <Send className="h-4 w-4" /> Reply
        </button>
      </form>
    </section>
  );
}
