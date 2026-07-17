import Link from "next/link";
import { archiveBrandAction, deleteBrandAction } from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

const pageSize = 20;

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string; error?: string }>;
}) {
  await requirePermission("products.update");
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const page = Math.max(1, Number(params?.page ?? 1));
  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { country: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.brand.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <AdminHero
        title="Brand Management"
        description="Manage brand metadata, logos, SEO, active status and safe archive/delete rules."
      />
      {params?.error ? (
        <p className="rounded-md bg-coral/10 p-3 text-sm font-bold text-coral">
          {params.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex min-w-0 flex-1 gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search brands, slugs or countries"
            className="h-11 min-w-0 flex-1 rounded-md border border-[var(--border)] px-3"
          />
          <button className="rounded-md bg-navy px-4 font-black text-white">
            Search
          </button>
        </form>
        <Link href="/admin/brands/new" className="rounded-md bg-coral px-4 py-3 font-black text-white">
          New brand
        </Link>
      </div>

      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Brand</th>
                <th className="p-3">Country</th>
                <th className="p-3">Products</th>
                <th className="p-3">Status</th>
                <th className="p-3">Updated</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id} className="border-t border-[var(--border)]">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-md bg-cream font-black text-teal">
                        {brand.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={brand.logo} alt="" className="h-full w-full object-contain p-1" />
                        ) : (
                          brand.name.slice(0, 1)
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/brands/${brand.id}/edit`} className="font-black text-navy">
                          {brand.name}
                        </Link>
                        <p className="text-xs font-bold text-slate-500">/{brand.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{brand.country || "Not set"}</td>
                  <td className="p-3">{brand._count.products}</td>
                  <td className="p-3">
                    <span className={brand.archivedAt || !brand.active ? "rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-500" : "rounded-full bg-teal/10 px-2 py-1 text-xs font-black text-teal"}>
                      {brand.archivedAt ? "Archived" : brand.active ? "Active" : "Inactive"}
                    </span>
                    {brand.featured ? <span className="ml-2 rounded-full bg-sun px-2 py-1 text-xs font-black text-navy">Featured</span> : null}
                  </td>
                  <td className="p-3">{brand.updatedAt.toLocaleDateString("en-BD")}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/brands/${brand.id}/edit`} className="rounded-md border border-[var(--border)] px-3 py-2 font-bold text-navy">Edit</Link>
                      <form action={archiveBrandAction}><input type="hidden" name="brandId" value={brand.id} /><button className="rounded-md bg-slate-100 px-3 py-2 font-bold text-slate-700">Archive</button></form>
                      <form action={deleteBrandAction}><input type="hidden" name="brandId" value={brand.id} /><button className="rounded-md bg-coral/10 px-3 py-2 font-bold text-coral">Delete</button></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] p-4 text-sm font-bold">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Link className="rounded-md border px-3 py-2" href={`/admin/brands?q=${encodeURIComponent(q)}&page=${Math.max(1, page - 1)}`}>Previous</Link>
            <Link className="rounded-md border px-3 py-2" href={`/admin/brands?q=${encodeURIComponent(q)}&page=${Math.min(pages, page + 1)}`}>Next</Link>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
