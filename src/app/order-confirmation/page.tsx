import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { currentUser } from "@/server/security";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const user = await currentUser();
  const { order: number } = await searchParams;
  if (!number) notFound();
  const order = await prisma.order.findFirst({
    where: { number, OR: [{ userId: user?.id }, { userId: null }] },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  return (
    <section className="container py-16">
      <div className="rounded-lg bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-black uppercase text-teal">Order confirmed</p>
        <h1 className="mt-2 text-4xl font-black text-navy">Thank you for shopping with KhelaGhor.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">Your order number is {order.number}. Total: {money(Number(order.total))}.</p>
        <div className="mx-auto mt-6 max-w-xl text-left">{order.items.map((item) => <p key={item.id} className="border-b border-[var(--border)] py-2">{item.quantity} × {item.name}</p>)}</div>
        <Link href="/account/orders" className="mt-8 inline-block rounded-md bg-coral px-6 py-3 font-black text-white">View Order</Link>
      </div>
    </section>
  );
}
