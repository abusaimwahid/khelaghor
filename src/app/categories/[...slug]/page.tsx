import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/server/db";
import { productInclude, productToCard } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const currentSlug = slug.at(-1) ?? slug[0];
  const category = await prisma.category.findUnique({
    where: { slug: currentSlug },
    include: {
      parent: true,
      children: {
        where: { archivedAt: null },
        include: { _count: { select: { products: true } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      _count: { select: { products: true } },
    },
  });
  if (!category || category.archivedAt) notFound();
  const brand = first(query.brand);
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      active: true,
      archivedAt: null,
      categories: { some: { categoryId: category.id } },
      ...(brand ? { brand: { slug: brand } } : {}),
    },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 36,
  });
  const cards = products.map(productToCard);
  const featured = cards.filter((product) => product.badges.includes("Featured"));
  const blogs = await prisma.blogPost.findMany({
    where: {
      draft: false,
      OR: [
        { title: { contains: category.name, mode: "insensitive" } },
        { excerpt: { contains: category.name, mode: "insensitive" } },
      ],
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 3,
  });
  return (
    <div className="bg-[var(--background)] py-6">
      <div className="container">
        <nav className="mb-4 text-sm font-bold text-slate-500">
          <Link href="/" className="hover:text-navy">Home</Link>
          <span className="px-2">/</span>
          <Link href="/categories" className="hover:text-navy">Categories</Link>
          <span className="px-2">/</span>
          <span className="text-navy">{category.name}</span>
        </nav>
        <section className="grid gap-5 rounded-[var(--radius-hero)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-md)] md:grid-cols-[1fr_280px] md:p-8">
          <div>
            <p className="text-sm font-black uppercase text-teal">
              {category.parent ? category.parent.name : "Category"}
            </p>
            <h1 className="mt-1 text-3xl font-black text-navy md:text-5xl">{category.name}</h1>
            <p className="mt-3 max-w-3xl font-semibold leading-7 text-slate-600">
              {category.description ||
                `Browse safe, high-quality ${category.name.toLowerCase()} with database-backed filters, product counts and Bangladesh-ready checkout.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/shop?category=${category.slug}`} className="rounded-md bg-coral px-5 py-3 font-black text-white">
                Shop all {category.name}
              </Link>
              <span className="rounded-md bg-cream px-5 py-3 font-black text-navy">
                {category._count.products} products
              </span>
            </div>
          </div>
          <div className="grid min-h-48 place-items-center rounded-[var(--radius-panel)] bg-[var(--surface-peach)]">
            {category.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={category.image} alt="" className="h-full max-h-56 w-full object-contain p-4" />
            ) : (
              <PackageSearch className="h-16 w-16 text-coral" />
            )}
          </div>
        </section>

        {category.children.length ? (
          <section className="py-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {category.children.map((child) => (
                <Link key={child.id} href={`/categories/${child.slug}`} className="flex min-h-24 flex-col justify-between rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                  <strong className="text-navy">{child.name}</strong>
                  <p className="mt-1 text-xs font-bold text-slate-500">{child._count.products} products</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {featured.length ? (
          <section className="py-6">
            <SectionTitle title="Featured in this category" href={`/shop?category=${category.slug}&featured=true`} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
              {featured.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          </section>
        ) : null}

        <section className="py-6">
          <SectionTitle title="Products in this category" href={`/shop?category=${category.slug}`} />
          {cards.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {cards.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 5} />
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-white p-8 text-center font-bold text-slate-500">
              No published products in this category yet.
            </div>
          )}
        </section>

        <section className="grid gap-5 py-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <h2 className="text-2xl font-black text-navy">Category guide</h2>
            <p className="mt-3 leading-7 text-slate-600">
              {category.seoDescription ||
                `KhelaGhor keeps ${category.name.toLowerCase()} organised with clear filters, child categories and product details so parents can compare quickly and buy confidently.`}
            </p>
          </div>
          <div className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <h2 className="font-black text-navy">Buying guides</h2>
            <div className="mt-3 space-y-3">
              {blogs.length ? (
                blogs.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block text-sm font-bold text-slate-600 hover:text-navy">
                    {post.title}
                  </Link>
                ))
              ) : (
                <p className="text-sm font-semibold text-slate-500">
                  Related buying guides will appear after blog posts are published.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-2xl font-black text-navy">{title}</h2>
      <Link href={href} className="hidden items-center gap-1 font-black text-coral md:inline-flex">
        View all <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
