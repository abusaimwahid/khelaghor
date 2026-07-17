import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { dhakaDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PackingSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("orders.view");
  const { id } = await params;
  const order = await prisma.order.findUniqueOrThrow({
    where: { id },
    include: { address: true, items: true },
  });
  return (
    <main className="mx-auto max-w-4xl bg-white p-8 print:p-0">
      <style>{`@media print {.no-print{display:none}.slip{box-shadow:none;margin:0}}`}</style>
      <p className="no-print mb-4 rounded-md bg-navy px-4 py-2 font-bold text-white">
        Use your browser print command to print this packing slip.
      </p>
      <section className="slip rounded-lg border p-8">
        <header className="flex justify-between border-b pb-5">
          <div>
            <h1 className="text-3xl font-black text-navy">Packing Slip</h1>
            <p className="font-bold">Order {order.number}</p>
            <p>{dhakaDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="font-black">{order.address?.name}</p>
            <p>{order.phone ?? order.address?.phone}</p>
            <p>{order.deliveryMethod}</p>
          </div>
        </header>
        <section className="py-5">
          <h2 className="font-black">Delivery Address</h2>
          <p>{order.address?.line1}</p>
          <p>{order.address?.area}, {order.address?.district}, {order.address?.division}</p>
          {order.deliveryNote ? <p>Note: {order.deliveryNote}</p> : null}
        </section>
        <table className="w-full text-left text-sm">
          <thead className="border-y bg-cream">
            <tr>
              <th className="p-3">Packed</th>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Qty</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3"><span className="inline-block h-5 w-5 border" /></td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.sku}</td>
                <td className="p-3">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <h2 className="font-black">Courier</h2>
            <p>Provider: {order.courierProvider || "________________"}</p>
            <p>Tracking: {order.trackingId || "________________"}</p>
          </div>
          <div className="rounded-md border p-4">
            <h2 className="font-black">Special Note</h2>
            <p>{order.deliveryNote || "________________________________________"}</p>
          </div>
        </section>
      </section>
    </main>
  );
}
