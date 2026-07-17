import { archiveBrandAction, deleteBrandAction } from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { BrandForm } from "@/components/admin/brand-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function EditBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  await requirePermission("products.update");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [brand, productCount] = await Promise.all([
    prisma.brand.findUniqueOrThrow({ where: { id } }),
    prisma.product.count({ where: { brandId: id } }),
  ]);

  return (
    <AdminShell>
      <AdminHero
        title={`Edit ${brand.name}`}
        description="Update brand identity, SEO, status and archive-safe visibility."
      />
      {query?.saved ? (
        <p className="rounded-md bg-teal/10 p-3 text-sm font-bold text-teal">
          Brand saved.
        </p>
      ) : null}
      {query?.error ? (
        <p className="rounded-md bg-coral/10 p-3 text-sm font-bold text-coral">
          {query.error}
        </p>
      ) : null}
      <BrandForm brand={brand} />
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Danger Zone</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          This brand is assigned to {productCount} products. Delete is blocked while products use it; archive is safe.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={archiveBrandAction}>
            <input name="brandId" type="hidden" value={brand.id} />
            <button className="rounded-md bg-slate-100 px-4 py-3 font-black text-slate-700">
              Archive brand
            </button>
          </form>
          <form action={deleteBrandAction}>
            <input name="brandId" type="hidden" value={brand.id} />
            <button className="rounded-md bg-coral px-4 py-3 font-black text-white">
              Delete brand
            </button>
          </form>
        </div>
      </section>
    </AdminShell>
  );
}
