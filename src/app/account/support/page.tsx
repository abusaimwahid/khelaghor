import { createSupportTicketAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await requireUser();
  const tickets = await prisma.supportTicket.findMany({ where: { userId: user.id }, include: { messages: true }, orderBy: { createdAt: "desc" } });
  return <section className="container grid gap-8 py-10 lg:grid-cols-[360px_1fr]"><form action={createSupportTicketAction} className="rounded-lg bg-white p-6 shadow-sm"><h1 className="text-2xl font-black text-navy">Create Ticket</h1><input name="category" placeholder="Category" className="mt-4 w-full rounded-md border p-3" /><input name="subject" placeholder="Subject" className="mt-4 w-full rounded-md border p-3" /><textarea name="body" placeholder="Message" className="mt-4 min-h-32 w-full rounded-md border p-3" /><button className="mt-4 rounded-md bg-coral px-5 py-3 font-black text-white">Send</button></form><div className="space-y-3">{tickets.map((t) => <article key={t.id} className="rounded-lg bg-white p-5 shadow-sm"><strong>{t.subject}</strong><p className="text-sm text-slate-500">{t.status}</p>{t.messages.map((m) => <p key={m.id} className="mt-2 rounded-md bg-cream p-3">{m.body}</p>)}</article>)}</div></section>;
}
