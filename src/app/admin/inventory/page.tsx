import { adjustInventoryAction } from "@/app/actions/admin";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requirePermission("products.update");
  const products = await prisma.product.findMany({ include: { inventory: true, variants: true }, orderBy: { name: "asc" } });
  return (
    <section className="container py-10">
      <h1 className="mb-6 text-3xl font-black text-navy">Inventory</h1>
      <div className="space-y-3">{products.map((p) => <form key={p.id} action={adjustInventoryAction} className="grid gap-3 rounded-lg bg-white p-4 shadow-sm md:grid-cols-[1fr_120px_120px_160px]"><input type="hidden" name="productId" value={p.id} /><div><strong>{p.name}</strong><p className="text-sm text-slate-500">Available: {p.inventory?.available ?? p.stock} • Reserved: {p.inventory?.reserved ?? 0}</p></div><input name="difference" type="number" className="rounded-md border border-[var(--border)] p-2" /><input name="reason" placeholder="Reason" className="rounded-md border border-[var(--border)] p-2" /><button className="rounded-md bg-navy px-4 font-bold text-white">Adjust</button></form>)}</div>
    </section>
  );
}
