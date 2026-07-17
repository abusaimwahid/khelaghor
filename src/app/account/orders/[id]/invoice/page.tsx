import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { getSiteSettings } from "@/server/site-settings";
import { dhakaDate, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const [settings, order] = await Promise.all([
    getSiteSettings(),
    prisma.order.findUnique({
      where: { id },
      include: { address: true, items: true, payments: true },
    }),
  ]);
  if (!order || order.userId !== user.id) notFound();
  return (
    <main className="mx-auto max-w-4xl bg-white p-8 print:p-0">
      <style>{`@media print {.no-print{display:none}.invoice{box-shadow:none;margin:0}}`}</style>
      <p className="no-print mb-4 rounded-md bg-navy px-4 py-2 font-bold text-white">
        Use your browser print command to print or save this invoice.
      </p>
      <section className="invoice rounded-lg border p-8">
        <header className="flex justify-between gap-6 border-b pb-6">
          <div>
            <h1 className="text-3xl font-black text-navy">{settings.general.storeName}</h1>
            <p>{settings.general.address}</p>
            <p>{settings.general.supportEmail}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black">Invoice</h2>
            <p>INV-{order.number}</p>
            <p>{dhakaDate(order.createdAt)}</p>
          </div>
        </header>
        <section className="grid gap-6 py-6 md:grid-cols-2">
          <div>
            <h3 className="font-black">Customer</h3>
            <p>{order.address?.name}</p>
            <p>{order.email}</p>
            <p>{order.phone}</p>
          </div>
          <div>
            <h3 className="font-black">Delivery</h3>
            <p>{order.address?.line1}</p>
            <p>{order.address?.area}, {order.address?.district}, {order.address?.division}</p>
          </div>
        </section>
        <table className="w-full text-left text-sm">
          <thead className="border-y bg-cream">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Unit</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.sku}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{money(Number(item.unitPrice))}</td>
                <td className="p-3 text-right">{money(Number(item.unitPrice) * item.quantity - Number(item.discount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <section className="ml-auto mt-6 max-w-sm space-y-2">
          <Line label="Subtotal" value={money(Number(order.subtotal))} />
          <Line label="Discount" value={money(Number(order.discount))} />
          <Line label="Delivery fee" value={money(Number(order.deliveryFee))} />
          <Line label="Total" value={money(Number(order.total))} strong />
        </section>
        <footer className="mt-8 border-t pt-4 text-sm">
          Payment: {order.paymentMethod} · {order.paymentStatus}
        </footer>
      </section>
    </main>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={strong ? "flex justify-between border-t pt-2 text-xl font-black" : "flex justify-between"}><span>{label}</span><span>{value}</span></div>;
}
