import Link from "next/link";
import { createSupportTicketAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { UploadField } from "@/components/forms/upload-field";

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
    <section className="container grid gap-8 py-10 lg:grid-cols-[380px_1fr]">
      <form action={createSupportTicketAction} className="kg-card h-fit p-6">
        <h1 className="text-2xl font-black text-navy">Create Ticket</h1>
        <input
          name="category"
          placeholder="Category"
          className="kg-input mt-4"
        />
        <select name="priority" className="kg-input mt-4">
          <option>NORMAL</option>
          <option>HIGH</option>
          <option>URGENT</option>
        </select>
        <input name="subject" placeholder="Subject" className="kg-input mt-4" />
        <textarea
          name="body"
          placeholder="Message"
          className="kg-input mt-4 min-h-32"
        />
        <UploadField name="attachmentUrls" purpose="support-attachment" label="Attachments (images or PDF)" accept="image/*,application/pdf" />
        <button className="mt-4 rounded-md bg-coral px-5 py-3 font-black text-white">
          Send
        </button>
      </form>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="kg-card p-5">
            <Link
              href={`/account/support/${ticket.id}`}
              className="font-black text-navy"
            >
              {ticket.subject}
            </Link>
            <p className="text-sm text-slate-500">
              {ticket.number} • {ticket.priority} • {ticket.status}
            </p>
            {ticket.messages.slice(-1).map((message) => (
              <p
                key={message.id}
                className="mt-2 rounded-md bg-cream p-3 text-sm"
              >
                {message.body}
              </p>
            ))}
          </article>
        ))}
        {!tickets.length ? (
          <p className="kg-card p-5 text-sm font-semibold text-slate-500">
            No support tickets yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
