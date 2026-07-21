import Link from "next/link";
import { Prisma } from "@prisma/client";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/server/db";
import { productInclude, productToCard } from "@/server/catalog";

export const dynamic = "force-dynamic";

const pageSize = 20;

type Params = Record<string, string | string[] | undefined>;

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const params = (await searchParams) ?? {};
  const page = Math.max(1, Number(value(params.page) ?? 1) || 1);
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { archivedAt: null, parentId: null },
      include: {
        children: { where: { archivedAt: null } },
        _count: { select: { products: true } },
      },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 12,
    }),
    prisma.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 16,
    }),
  ]);
  const where = buildWhere(params);
  const [products, count] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: buildOrder(value(params.sort)),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const cards = products.map(productToCard);
  const activeFilters = activeFilterLabels(params);
  return (
    <div className="storefront-page">
      <div className="container">
        <nav className="storefront-breadcrumb mb-5">
          <Link href="/" className="hover:text-navy">
            Home
          </Link>
          <span className="px-2">/</span>
          <span className="text-navy">Shop</span>
        </nav>
        <section className="storefront-surface overflow-hidden rounded-[var(--radius-panel)] p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="storefront-eyebrow">Curated for growing minds</p>
              <h1 className="storefront-title mt-2">Shop KhelaGhor</h1>
              <p className="mt-1 font-semibold text-slate-600">
                {count} database product{count === 1 ? "" : "s"} found
              </p>
            </div>
            <form className="flex flex-wrap gap-2">
              <input
                name="q"
                defaultValue={value(params.q) ?? ""}
                placeholder="Search products"
                className="kg-input h-12 min-w-[220px]"
              />
              <select
                name="sort"
                defaultValue={value(params.sort) ?? "newest"}
                className="kg-input h-12 w-auto font-bold"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
                <option value="discount">Biggest discount</option>
                <option value="rated">Best rated</option>
              </select>
              <button className="kg-button kg-button-dark px-6">Apply</button>
            </form>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="min-w-fit rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-black text-navy transition hover:border-coral hover:text-coral"
              >
                {category.name} ({category._count.products})
              </Link>
            ))}
          </div>
          {activeFilters.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-3 py-1 text-xs font-black text-coral"
                >
                  {filter}
                  <X className="h-3 w-3" />
                </span>
              ))}
              <Link href="/shop" className="text-xs font-black text-navy">
                Clear all
              </Link>
            </div>
          ) : null}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="storefront-surface hidden h-fit rounded-[var(--radius-panel)] p-6 lg:sticky lg:top-40 lg:block">
            <FilterSidebar
              categories={categories}
              brands={brands}
              params={params}
            />
          </aside>
          <details className="storefront-surface rounded-[var(--radius-panel)] p-4 lg:hidden">
            <summary className="flex items-center gap-2 font-black text-navy">
              <SlidersHorizontal className="h-5 w-5" />
              Filters
            </summary>
            <div className="mt-4">
              <FilterSidebar
                categories={categories}
                brands={brands}
                params={params}
              />
            </div>
          </details>
          <main>
            {cards.length ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {cards.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                  />
                ))}
              </div>
            ) : (
              <div className="storefront-surface border-dashed p-12 text-center">
                <h2 className="text-xl font-black text-navy">
                  No products found
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Try clearing filters or searching another category.
                </p>
              </div>
            )}
            <div className="mt-6 flex justify-between">
              <PageLink disabled={page <= 1} params={params} page={page - 1}>
                Previous
              </PageLink>
              <PageLink
                disabled={page >= totalPages}
                params={params}
                page={page + 1}
              >
                Next
              </PageLink>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function FilterSidebar({
  categories,
  brands,
  params,
}: {
  categories: { name: string; slug: string; _count: { products: number } }[];
  brands: { name: string; slug: string; _count: { products: number } }[];
  params: Params;
}) {
  return (
    <form className="space-y-5">
      <FilterGroup title="Category">
        {categories.map((category) => (
          <RadioLink
            key={category.slug}
            name="category"
            value={category.slug}
            current={value(params.category)}
            label={`${category.name} (${category._count.products})`}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Brand">
        {brands.map((brand) => (
          <RadioLink
            key={brand.slug}
            name="brand"
            value={brand.slug}
            current={value(params.brand)}
            label={`${brand.name} (${brand._count.products})`}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        <input
          name="min"
          defaultValue={value(params.min) ?? ""}
          placeholder="Min"
          className="kg-input mb-2 h-10"
        />
        <input
          name="max"
          defaultValue={value(params.max) ?? ""}
          placeholder="Max"
          className="kg-input h-10"
        />
      </FilterGroup>
      <FilterGroup title="Discovery">
        {[
          ["availability", "in", "In stock"],
          ["discount", "true", "On sale"],
          ["featured", "true", "Featured"],
        ].map(([name, optionValue, label]) => (
          <RadioLink
            key={label}
            name={name}
            value={optionValue}
            current={value(params[name])}
            label={label}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Age and attributes">
        <input
          name="age"
          defaultValue={value(params.age) ?? ""}
          placeholder="Age group"
          className="mb-2 h-10 w-full rounded-md border border-[var(--border)] px-3"
        />
        <input
          name="gender"
          defaultValue={value(params.gender) ?? ""}
          placeholder="Gender"
          className="mb-2 h-10 w-full rounded-md border border-[var(--border)] px-3"
        />
        <input
          name="material"
          defaultValue={value(params.material) ?? ""}
          placeholder="Material"
          className="mb-2 h-10 w-full rounded-md border border-[var(--border)] px-3"
        />
        <input
          name="productType"
          defaultValue={value(params.productType) ?? ""}
          placeholder="Product type"
          className="h-10 w-full rounded-md border border-[var(--border)] px-3"
        />
      </FilterGroup>
      <button className="kg-button kg-button-primary w-full">
        Apply filters
      </button>
    </form>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[var(--border)] pb-4 last:border-0">
      <h2 className="mb-3 font-black text-navy">{title}</h2>
      <div className="space-y-2 text-sm font-bold text-slate-600">
        {children}
      </div>
    </section>
  );
}

function RadioLink({
  name,
  value,
  current,
  label,
}: {
  name: string;
  value: string;
  current?: string;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        name={name}
        type="radio"
        value={value}
        defaultChecked={current === value}
      />
      {label}
    </label>
  );
}

function buildWhere(params: Params): Prisma.ProductWhereInput {
  const min = Number(value(params.min));
  const max = Number(value(params.max));
  return {
    status: "PUBLISHED",
    active: true,
    archivedAt: null,
    ...(value(params.q)
      ? {
          OR: [
            { name: { contains: value(params.q), mode: "insensitive" } },
            { sku: { contains: value(params.q), mode: "insensitive" } },
            {
              searchKeywords: {
                contains: value(params.q),
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(value(params.category)
      ? { categories: { some: { category: { slug: value(params.category) } } } }
      : {}),
    ...(value(params.brand) ? { brand: { slug: value(params.brand) } } : {}),
    ...(Number.isFinite(min) && min > 0 ? { regularPrice: { gte: min } } : {}),
    ...(Number.isFinite(max) && max > 0 ? { regularPrice: { lte: max } } : {}),
    ...(value(params.availability) === "in" ? { stock: { gt: 0 } } : {}),
    ...(value(params.discount) === "true" ? { salePrice: { not: null } } : {}),
    ...(value(params.featured) === "true" ? { featured: true } : {}),
    ...(value(params.age)
      ? { ageGroup: { contains: value(params.age), mode: "insensitive" } }
      : {}),
    ...(value(params.gender)
      ? { gender: { contains: value(params.gender), mode: "insensitive" } }
      : {}),
    ...(value(params.material)
      ? { material: { contains: value(params.material), mode: "insensitive" } }
      : {}),
    ...(value(params.productType)
      ? {
          productType: {
            contains: value(params.productType),
            mode: "insensitive",
          },
        }
      : {}),
  };
}

function buildOrder(sort = "newest"): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price-asc") return { regularPrice: "asc" };
  if (sort === "price-desc") return { regularPrice: "desc" };
  if (sort === "rated") return { updatedAt: "desc" };
  if (sort === "discount") return { salePrice: "asc" };
  return { publishedAt: "desc" };
}

function activeFilterLabels(params: Params) {
  return [
    "q",
    "category",
    "brand",
    "min",
    "max",
    "availability",
    "discount",
    "featured",
    "age",
    "gender",
    "material",
    "productType",
  ]
    .map((key) => (value(params[key]) ? `${key}: ${value(params[key])}` : ""))
    .filter(Boolean);
}

function PageLink({
  disabled,
  params,
  page,
  children,
}: {
  disabled: boolean;
  params: Params;
  page: number;
  children: React.ReactNode;
}) {
  if (disabled)
    return (
      <span className="rounded-md border border-[var(--border)] px-4 py-2 font-black text-slate-400">
        {children}
      </span>
    );
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    const item = value(raw);
    if (item && key !== "page") query.set(key, item);
  }
  query.set("page", String(page));
  return (
    <Link
      href={`/shop?${query}`}
      className="rounded-md border border-[var(--border)] bg-white px-4 py-2 font-black text-navy"
    >
      {children}
    </Link>
  );
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}
