import {
  archiveCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { CategoryForm } from "@/components/admin/category-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  await requirePermission("products.update");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [category, categories, childCount, productCount] = await Promise.all([
    prisma.category.findUniqueOrThrow({ where: { id } }),
    prisma.category.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.category.count({ where: { parentId: id, archivedAt: null } }),
    prisma.productCategory.count({ where: { categoryId: id } }),
  ]);

  return (
    <AdminShell>
      <AdminHero
        title={`Edit ${category.name}`}
        description="Update hierarchy, status, media, SEO and safe catalog visibility."
      />
      {query?.saved ? (
        <p className="rounded-md bg-teal/10 p-3 text-sm font-bold text-teal">
          Category saved.
        </p>
      ) : null}
      {query?.error ? (
        <p className="rounded-md bg-coral/10 p-3 text-sm font-bold text-coral">
          {query.error}
        </p>
      ) : null}
      <CategoryForm category={category} categories={categories} />
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Danger Zone</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          This category has {childCount} child categories and {productCount} assigned products.
          Delete is blocked until both are zero; archive is safe for preserving URLs and history.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={archiveCategoryAction}>
            <input name="categoryId" type="hidden" value={category.id} />
            <button className="rounded-md bg-slate-100 px-4 py-3 font-black text-slate-700">
              Archive category
            </button>
          </form>
          <form action={deleteCategoryAction}>
            <input name="categoryId" type="hidden" value={category.id} />
            <button className="rounded-md bg-coral px-4 py-3 font-black text-white">
              Delete category
            </button>
          </form>
        </div>
      </section>
    </AdminShell>
  );
}
