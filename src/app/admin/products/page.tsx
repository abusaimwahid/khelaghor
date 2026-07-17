import Link from "next/link";
import { Prisma, ProductStatus } from "@prisma/client";
import { Download, Pencil, Plus, Search } from "lucide-react";
import { bulkProductAction } from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { money, dhakaDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const pageSize = 12;

type SearchParams = {
  q?: string;
  category?: string;
  brand?: string;
  status?: string;
  stock?: string;
  featured?: string;
  sort?: string;
  page?: string;
  error?: string;
  success?: string;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("products.view");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const where = buildWhere(params);
  const orderBy = buildOrder(params.sort);
  const [products, count, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: true,
        categories: { include: { category: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        inventory: true,
        variants: true,
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const queryBase = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => key !== "page" && value),
  );
  return (
    <AdminShell>
      <AdminHero
        title="Product Management"
        description="Search, filter, publish, feature, archive and edit database-backed catalog products without touching storefront or checkout internals."
      />
      {params.error ? (
        <div className="rounded-md border border-coral bg-coral/10 p-3 font-bold text-coral">
          {params.error}
        </div>
      ) : null}
      {params.success ? (
        <div className="rounded-md border border-teal bg-teal/10 p-3 font-bold text-teal">
          {params.success}
        </div>
      ) : null}
      <section className="kg-card p-4">
        <form className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search name, SKU or barcode"
              className="admin-input h-11 pl-9 pr-3"
            />
          </label>
          <Select
            name="category"
            value={params.category}
            label="All categories"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select name="brand" value={params.brand} label="All brands">
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
          <Select name="status" value={params.status} label="All statuses">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Select name="stock" value={params.stock} label="All stock">
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </Select>
          <Select name="featured" value={params.featured} label="Featured">
            <option value="true">Featured</option>
            <option value="false">Not featured</option>
          </Select>
          <button className="admin-button h-11 bg-navy px-4 text-white">
            Filter
          </button>
        </form>
      </section>

      <form action={bulkProductAction} className="kg-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
          <div>
            <h2 className="text-xl font-black text-navy">
              {count} product{count === 1 ? "" : "s"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Page {page} of {totalPages}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              name="bulkAction"
              className="h-10 rounded-md border border-[var(--border)] px-3 font-bold"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Bulk action
              </option>
              <option value="publish">Publish</option>
              <option value="unpublish">Unpublish</option>
              <option value="feature">Feature</option>
              <option value="unfeature">Remove featured</option>
              <option value="archive">Archive</option>
              <option value="delete">Delete if unused</option>
            </select>
            <button className="rounded-md border border-[var(--border)] px-4 font-black text-navy">
              Apply
            </button>
            <Link
              href="/admin/products/new"
              className="admin-button admin-button-primary"
            >
              <Plus className="h-4 w-4" />
              New
            </Link>
            <ExportLink params={params} />
          </div>
        </div>
        {products.length ? (
          <div className="table-wrap">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">
                    <span className="sr-only">Select</span>
                  </th>
                  <Th href={sortHref(params, "name")}>Product</Th>
                  <Th href={sortHref(params, "sku")}>SKU</Th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Brand</th>
                  <Th href={sortHref(params, "price")}>Price</Th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Flags</th>
                  <Th href={sortHref(params, "created")}>Created</Th>
                  <Th href={sortHref(params, "updated")}>Updated</Th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const available =
                    (product.inventory?.available ?? product.stock) -
                    product.reservedStock;
                  return (
                    <tr
                      key={product.id}
                      className="border-t border-[var(--border)] align-top"
                    >
                      <td className="p-3">
                        <input
                          name="productId"
                          type="checkbox"
                          value={product.id}
                        />
                      </td>
                      <td className="min-w-72 p-3">
                        <div className="flex gap-3">
                          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-cream">
                            {product.images[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].alt}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-400">
                                No image
                              </span>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="font-black text-navy hover:text-coral"
                            >
                              {product.name}
                            </Link>
                            <p className="mt-1 text-xs text-slate-500">
                              {product.status} • {product.variants.length}{" "}
                              variant
                              {product.variants.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-bold">{product.sku}</td>
                      <td className="p-3">
                        {product.categories[0]?.category.name ?? "Unassigned"}
                      </td>
                      <td className="p-3">
                        {product.brand?.name ?? "No brand"}
                      </td>
                      <td className="p-3">
                        <strong>{money(Number(product.regularPrice))}</strong>
                        {product.salePrice ? (
                          <p className="text-coral">
                            Sale {money(Number(product.salePrice))}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <p className="font-bold">{available} available</p>
                        <p className="text-xs text-slate-500">
                          {product.reservedStock} reserved
                        </p>
                        <StockBadge
                          available={available}
                          threshold={product.lowStockThreshold}
                        />
                      </td>
                      <td className="space-y-1 p-3">
                        {product.featured ? (
                          <StatusBadge>Featured</StatusBadge>
                        ) : null}
                        {product.newArrival ? (
                          <StatusBadge>New</StatusBadge>
                        ) : null}
                        {product.bestSeller ? (
                          <StatusBadge>Best</StatusBadge>
                        ) : null}
                        {product.flashSale ? (
                          <StatusBadge>Sale</StatusBadge>
                        ) : null}
                      </td>
                      <td className="p-3">{dhakaDate(product.createdAt)}</td>
                      <td className="p-3">{dhakaDate(product.updatedAt)}</td>
                      <td className="p-3">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="inline-flex items-center gap-1 font-black text-coral"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <h2 className="text-xl font-black text-navy">No products found</h2>
            <p className="mt-2 text-sm text-slate-500">
              Adjust filters or create a product to start filling the catalog.
            </p>
          </div>
        )}
      </form>
      <div className="flex justify-between">
        <PageLink
          disabled={page <= 1}
          href={`/admin/products?${withPage(queryBase, page - 1)}`}
        >
          Previous
        </PageLink>
        <PageLink
          disabled={page >= totalPages}
          href={`/admin/products?${withPage(queryBase, page + 1)}`}
        >
          Next
        </PageLink>
      </div>
    </AdminShell>
  );
}

function buildWhere(params: SearchParams): Prisma.ProductWhereInput {
  return {
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { sku: { contains: params.q, mode: "insensitive" } },
            { barcode: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.category
      ? { categories: { some: { categoryId: params.category } } }
      : {}),
    ...(params.brand ? { brandId: params.brand } : {}),
    ...(params.status
      ? { status: params.status as ProductStatus }
      : { archivedAt: null }),
    ...(params.featured === "true"
      ? { featured: true }
      : params.featured === "false"
        ? { featured: false }
        : {}),
    ...(params.stock === "out"
      ? { stock: { lte: 0 } }
      : params.stock === "low"
        ? { stock: { gt: 0, lte: 5 } }
        : params.stock === "in"
          ? { stock: { gt: 0 } }
          : {}),
  };
}

function buildOrder(
  sort = "updated-desc",
): Prisma.ProductOrderByWithRelationInput {
  if (sort === "name") return { name: "asc" };
  if (sort === "sku") return { sku: "asc" };
  if (sort === "price") return { regularPrice: "asc" };
  if (sort === "created") return { createdAt: "desc" };
  return { updatedAt: "desc" };
}

function Select({
  name,
  value,
  label,
  children,
}: {
  name: string;
  value?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={value ?? ""}
      className="h-11 rounded-md border border-[var(--border)] px-3"
    >
      <option value="">{label}</option>
      {children}
    </select>
  );
}

function Th({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <th className="p-3">
      <Link href={href} className="hover:text-navy">
        {children}
      </Link>
    </th>
  );
}

function sortHref(params: SearchParams, sort: string) {
  const query = new URLSearchParams(
    Object.entries({ ...params, sort, page: "1" }).filter(([, value]) => value),
  );
  return `/admin/products?${query}`;
}

function withPage(query: URLSearchParams, page: number) {
  const next = new URLSearchParams(query);
  next.set("page", String(page));
  return next.toString();
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-md border border-[var(--border)] px-4 py-2 font-bold text-slate-400">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-md border border-[var(--border)] px-4 py-2 font-bold text-navy"
    >
      {children}
    </Link>
  );
}

function StockBadge({
  available,
  threshold,
}: {
  available: number;
  threshold: number;
}) {
  if (available <= 0) return <StatusBadge>Out of Stock</StatusBadge>;
  if (available <= threshold) return <StatusBadge>Limited Stock</StatusBadge>;
  return <StatusBadge>In Stock</StatusBadge>;
}

function ExportLink({ params }: { params: SearchParams }) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value),
  );
  return (
    <Link
      href={`/admin/products/export?${query}`}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] px-4 font-black text-navy"
    >
      <Download className="h-4 w-4" />
      CSV
    </Link>
  );
}
