import { submitReturnAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const user = await requireUser();
  const items = await prisma.orderItem.findMany({ where: { order: { userId: user.id, status: { in: ["DELIVERED", "RETURNED"] } } }, include: { order: true } });
  const returns = await prisma.returnRequest.findMany({ where: { userId: user.id }, include: { items: true }, orderBy: { createdAt: "desc" } });
  return <section className="container grid gap-8 py-10 lg:grid-cols-[360px_1fr]"><form action={submitReturnAction} className="rounded-lg bg-white p-6 shadow-sm"><h1 className="text-2xl font-black text-navy">Return Request</h1><select name="orderItemId" className="mt-4 w-full rounded-md border p-3">{items.map((i) => <option key={i.id} value={i.id}>{i.order.number} • {i.name}</option>)}</select><input name="quantity" type="number" min="1" defaultValue="1" className="mt-4 w-full rounded-md border p-3" /><input name="reason" placeholder="Reason" className="mt-4 w-full rounded-md border p-3" /><textarea name="description" placeholder="Details" className="mt-4 min-h-28 w-full rounded-md border p-3" /><button className="mt-4 rounded-md bg-coral px-5 py-3 font-black text-white">Submit</button></form><div className="space-y-3">{returns.map((r) => <article key={r.id} className="rounded-lg bg-white p-5 shadow-sm"><strong>{r.reason}</strong><p className="text-sm text-slate-500">{r.status}</p></article>)}</div></section>;
}
