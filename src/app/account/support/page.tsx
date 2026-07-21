import Link from "next/link";
import { createSupportTicketAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { UploadField } from "@/components/forms/upload-field";
import { EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { MessageSquarePlus, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await requireUser();
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    include: {
      messages: { where: { public: true }, orderBy: { createdAt: "asc" } },
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section className="grid gap-5 pb-10 xl:grid-cols-[360px_1fr]">
      <form action={createSupportTicketAction} className="kg-card h-fit p-6">
        <MessageSquarePlus className="h-7 w-7 text-coral" /><h1 className="mt-3 text-2xl font-black text-navy">Create a ticket</h1><p className="mt-2 text-sm leading-6 text-slate-600">Tell us what happened and our support team will reply in this private thread.</p>
        <label className="mt-4 block text-sm font-bold text-navy">Category
        <input
          name="category"
          placeholder="Category"
          className="kg-input mt-4"
        /></label>
        <label className="mt-4 block text-sm font-bold text-navy">Priority
        <select name="priority" className="kg-input mt-4">
          <option>NORMAL</option>
          <option>HIGH</option>
          <option>URGENT</option>
        </select></label>
        <label className="mt-4 block text-sm font-bold text-navy">Subject<input name="subject" placeholder="Brief summary" className="kg-input mt-2" /></label>
        <label className="mt-4 block text-sm font-bold text-navy">Message
        <textarea
          name="body"
          placeholder="Message"
          className="kg-input mt-4 min-h-32"
        /></label>
        <UploadField name="attachmentUrls" purpose="support-attachment" label="Attachments (images or PDF)" accept="image/*,application/pdf" />
        <button className="kg-button kg-button-primary mt-4 w-full">
          Send
        </button>
      </form>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="kg-card p-5 transition hover:border-coral/30 hover:shadow-[var(--shadow-md)]">
            <Link
              href={`/account/support/${ticket.id}`}
              className="font-black text-navy"
            >
              {ticket.subject}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-slate-500">{ticket.number}</span><StatusBadge>{ticket.priority}</StatusBadge><StatusBadge>{ticket.status}</StatusBadge></div>
            {ticket.messages.slice(-1).map((message) => (
              <p
                key={message.id}
                className="mt-2 rounded-md bg-cream p-3 text-sm"
              >
                {message.body}
              </p>
            ))}
            <Link href={`/account/support/${ticket.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-black text-coral">Open conversation <ArrowRight className="h-4 w-4" /></Link>
          </article>
        ))}
        {!tickets.length ? <EmptyState title="No support tickets" description="Create a ticket when you need help with an order, delivery, payment or product." /> : null}
      </div>
    </section>
  );
}
