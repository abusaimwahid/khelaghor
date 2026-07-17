import Link from "next/link";
import type { ReactNode } from "react";
import {
  archiveCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
} from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

const pageSize = 20;

type TreeCategory = {
  id: string;
  name: string;
  parentId: string | null;
  _count: { products: number };
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    page?: string;
    error?: string;
    deleted?: string;
  }>;
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
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [categories, total, allCategories] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true, children: true } },
      },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.count({ where }),
    prisma.category.findMany({
      include: { children: true, _count: { select: { products: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <AdminHero
        title="Category Management"
        description="Manage hierarchy, SEO, images, sort order, featured state and archive-safe catalog navigation."
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
            placeholder="Search categories, slugs or descriptions"
            className="admin-input h-11 min-w-0 flex-1"
          />
          <button className="rounded-md bg-navy px-4 font-black text-white">
            Search
          </button>
        </form>
        <Link
          href="/admin/categories/new"
          className="admin-button admin-button-primary"
        >
          New category
        </Link>
      </div>

      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Parent</th>
                <th className="p-3">Products</th>
                <th className="p-3">Children</th>
                <th className="p-3">Status</th>
                <th className="p-3">Sort</th>
                <th className="p-3">Updated</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr
                  key={category.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-md bg-cream font-black text-coral">
                        {category.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={category.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          category.icon || category.name.slice(0, 1)
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="font-black text-navy"
                        >
                          {category.name}
                        </Link>
                        <p className="text-xs font-bold text-slate-500">
                          /{category.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    {category.parent?.name ?? "Top level"}
                  </td>
                  <td className="p-3">{category._count.products}</td>
                  <td className="p-3">{category._count.children}</td>
                  <td className="p-3">
                    <span
                      className={
                        category.archivedAt || !category.active
                          ? "rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-500"
                          : "rounded-full bg-teal/10 px-2 py-1 text-xs font-black text-teal"
                      }
                    >
                      {category.archivedAt
                        ? "Archived"
                        : category.active
                          ? "Active"
                          : "Inactive"}
                    </span>
                    {category.featured ? (
                      <span className="ml-2 rounded-full bg-sun px-2 py-1 text-xs font-black text-navy">
                        Featured
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3">{category.sortOrder}</td>
                  <td className="p-3">
                    {category.updatedAt.toLocaleDateString("en-BD")}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="rounded-md border border-[var(--border)] px-3 py-2 font-bold text-navy"
                      >
                        Edit
                      </Link>
                      <form action={moveCategoryAction}>
                        <input
                          type="hidden"
                          name="categoryId"
                          value={category.id}
                        />
                        <input type="hidden" name="direction" value="up" />
                        <button className="rounded-md border border-[var(--border)] px-3 py-2 font-bold">
                          Up
                        </button>
                      </form>
                      <form action={moveCategoryAction}>
                        <input
                          type="hidden"
                          name="categoryId"
                          value={category.id}
                        />
                        <input type="hidden" name="direction" value="down" />
                        <button className="rounded-md border border-[var(--border)] px-3 py-2 font-bold">
                          Down
                        </button>
                      </form>
                      <form action={archiveCategoryAction}>
                        <input
                          type="hidden"
                          name="categoryId"
                          value={category.id}
                        />
                        <button className="rounded-md bg-slate-100 px-3 py-2 font-bold text-slate-700">
                          Archive
                        </button>
                      </form>
                      <form action={deleteCategoryAction}>
                        <input
                          type="hidden"
                          name="categoryId"
                          value={category.id}
                        />
                        <button className="rounded-md bg-coral/10 px-3 py-2 font-bold text-coral">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={pages} q={q} />
      </section>

      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Tree View</h2>
        <div className="mt-4 space-y-2">
          {renderTree(
            allCategories.filter((item) => !item.parentId),
            allCategories,
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function renderTree(
  roots: TreeCategory[],
  all: TreeCategory[],
  depth = 0,
): ReactNode {
  return roots.map((category) => {
    const children = all.filter((item) => item.parentId === category.id);
    return (
      <div key={category.id} style={{ marginLeft: depth * 18 }}>
        <Link
          href={`/admin/categories/${category.id}/edit`}
          className="font-bold text-navy"
        >
          {category.name}
        </Link>
        <span className="ml-2 text-xs font-bold text-slate-500">
          {category._count.products} products
        </span>
        {children.length ? renderTree(children, all, depth + 1) : null}
      </div>
    );
  });
}

function Pagination({
  page,
  pages,
  q,
}: {
  page: number;
  pages: number;
  q: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--border)] p-4 text-sm font-bold">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Link
          className="rounded-md border px-3 py-2"
          href={`/admin/categories?q=${encodeURIComponent(q)}&page=${Math.max(1, page - 1)}`}
        >
          Previous
        </Link>
        <Link
          className="rounded-md border px-3 py-2"
          href={`/admin/categories?q=${encodeURIComponent(q)}&page=${Math.min(pages, page + 1)}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
