import Link from "next/link";
import {
  ArrowRight,
  PackageSearch,
  ShieldCheck,
  Truck,
  RefreshCcw,
  LockKeyhole,
  Clock,
} from "lucide-react";
import { ProductCard } from "./product-card";
import { StatusBadge } from "./status-badge";
import { money } from "@/lib/utils";
import type { CardProduct } from "./product-card";
import type {
  HomeSectionSettings,
  HomepageSettings,
} from "@/server/site-settings";

type CategorySummary = {
  name: string;
  slug: string;
  children: { name: string }[];
};

type BrandSummary = {
  name: string;
  slug: string;
};

type BlogSummary = {
  title: string;
  slug: string;
  excerpt: string;
};

export function SectionHeader({
  title,
  href,
  eyebrow,
}: {
  title: string;
  href?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-sm font-black uppercase text-teal">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-black text-navy md:text-3xl">{title}</h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden items-center gap-1 font-extrabold text-coral md:inline-flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function Hero({
  section,
  products,
}: {
  section: HomepageSettings["hero"];
  products: CardProduct[];
}) {
  if (!section.enabled) return null;
  return (
    <section className="overflow-hidden bg-gradient-to-br from-cream via-white to-[#e8fbf7]">
      <div className="container grid min-h-[560px] items-center gap-10 py-12 md:grid-cols-2">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-sun/50 px-4 py-2 text-sm font-black text-navy">
            {section.highlightedText}
          </p>
          <h1 className="max-w-xl text-4xl font-black leading-tight text-navy md:text-6xl">
            {section.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            {section.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={section.primaryButtonLink || "/shop"}
              className="rounded-md bg-coral px-6 py-3 font-black text-white shadow-lg shadow-coral/20"
            >
              {section.primaryButtonLabel || "Shop Now"}
            </Link>
            <Link
              href={section.secondaryButtonLink || "/categories"}
              className="rounded-md border border-[var(--border)] bg-white px-6 py-3 font-black text-navy"
            >
              {section.secondaryButtonLabel || "Explore Categories"}
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] rounded-lg bg-white p-5 shadow-2xl">
            {products.length ? (
              <div className="grid h-full grid-cols-2 gap-4">
                {products.slice(0, 4).map((product) => (
                  <div key={product.id} className="rounded-lg bg-cream p-4">
                    <p className="text-sm font-black text-navy">
                      {product.name}
                    </p>
                    <p className="mt-2 text-2xl font-black text-coral">
                      {money(product.salePrice ?? product.price)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid h-full place-items-center rounded-lg bg-cream p-6 text-center font-bold text-slate-500">
                Add published products to populate the hero.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryGrid({
  section,
  categories,
}: {
  section: HomeSectionSettings;
  categories: CategorySummary[];
}) {
  if (!section.enabled) return null;
  return (
    <section className="container py-12">
      <SectionHeader
        title={section.title}
        href={section.link || "/categories"}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <PackageSearch className="mb-4 h-8 w-8 text-coral" />
            <strong className="text-lg text-navy">{category.name}</strong>
            <p className="mt-2 text-sm text-slate-500">
              {category.children.map((child) => child.name).join(" • ") ||
                "No subcategories yet"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TrustBadges({ section }: { section: HomeSectionSettings }) {
  if (!section.enabled) return null;
  const items = [
    [ShieldCheck, "100% Child Safe"],
    [PackageSearch, "Premium Quality"],
    [Truck, "Fast Delivery"],
    [RefreshCcw, "Easy Returns"],
    [LockKeyhole, "Secure Payment"],
  ] as const;
  return (
    <section className="bg-white py-8">
      <div className="container grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(([Icon, label]) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg bg-cream p-4 font-black text-navy"
          >
            <Icon className="h-6 w-6 text-teal" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductGrid({
  title,
  items,
  href,
  eyebrow,
  section,
}: {
  title: string;
  items: CardProduct[];
  href?: string;
  eyebrow?: string;
  section?: HomeSectionSettings;
}) {
  if (section && !section.enabled) return null;
  return (
    <section className="container py-12">
      <SectionHeader
        title={section?.title ?? title}
        href={section?.link || href}
        eyebrow={eyebrow}
      />
      {items.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center font-bold text-slate-500">
          No published products are available for this section yet.
        </div>
      )}
    </section>
  );
}

export function PromoBands({
  section,
  banners,
}: {
  section: HomeSectionSettings;
  banners: {
    id: string;
    title: string;
    subtitle: string | null;
    href: string | null;
  }[];
}) {
  if (!section.enabled) return null;
  return (
    <section className="container grid gap-4 py-12 md:grid-cols-4">
      {banners.length ? (
        banners.map((promo, index) => (
          <Link
            key={promo.id}
            href={promo.href || section.link || "/offers"}
            className="rounded-lg bg-navy p-6 text-white shadow-sm"
          >
            <StatusBadge>{index % 2 ? "Featured" : "Sale"}</StatusBadge>
            <h3 className="mt-6 text-xl font-black">{promo.title}</h3>
            <p className="mt-2 text-sm text-white/70">
              {promo.subtitle || section.subtitle || "Curated collection"}
            </p>
          </Link>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-6 font-bold text-slate-500 md:col-span-4">
          No active promotional banners yet.
        </div>
      )}
    </section>
  );
}

export function DiscoveryRows({
  ageSection,
  genderSection,
}: {
  ageSection: HomeSectionSettings;
  genderSection: HomeSectionSettings;
}) {
  if (!ageSection.enabled && !genderSection.enabled) return null;
  return (
    <section className="container grid gap-8 py-12 lg:grid-cols-2">
      {ageSection.enabled ? (
        <div>
          <SectionHeader title={ageSection.title} />
          <div className="flex flex-wrap gap-3">
            {[
              "0-6 months",
              "6-12 months",
              "1-2 years",
              "3-5 years",
              "6-8 years",
              "9-12 years",
              "12+ years",
            ].map((age) => (
              <Link
                key={age}
                href={`/shop?age=${encodeURIComponent(age)}`}
                className="rounded-full bg-white px-4 py-2 font-bold text-navy shadow-sm"
              >
                {age}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {genderSection.enabled ? (
        <div>
          <SectionHeader title={genderSection.title} />
          <div className="flex flex-wrap gap-3">
            {["Boys", "Girls", "Unisex"].map((gender) => (
              <Link
                key={gender}
                href={`/shop?gender=${gender}`}
                className="rounded-full bg-white px-5 py-2 font-bold text-navy shadow-sm"
              >
                {gender}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function FlashSale({
  section,
  products,
}: {
  section: HomeSectionSettings;
  products: CardProduct[];
}) {
  if (!section.enabled) return null;
  return (
    <section className="bg-navy py-12 text-white">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-sun">
              Limited time
            </p>
            <h2 className="text-3xl font-black">{section.title}</h2>
          </div>
          <div className="flex gap-2 font-black">
            <Clock /> Local sale products
          </div>
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/20 p-6 font-bold text-white/70">
            Add sale prices to published products to populate flash sale.
          </div>
        )}
      </div>
    </section>
  );
}

export function ContentHighlights({
  brandSection,
  testimonialSection,
  blogSection,
  brands,
  blogPosts,
}: {
  brandSection: HomeSectionSettings;
  testimonialSection: HomeSectionSettings;
  blogSection: HomeSectionSettings;
  brands: BrandSummary[];
  blogPosts: BlogSummary[];
}) {
  if (
    !brandSection.enabled &&
    !testimonialSection.enabled &&
    !blogSection.enabled
  )
    return null;
  return (
    <section className="container grid gap-8 py-12 lg:grid-cols-3">
      {brandSection.enabled ? (
        <div className="lg:col-span-1">
          <SectionHeader
            title={brandSection.title}
            href={brandSection.link || "/brands"}
          />
          <div className="grid grid-cols-2 gap-3">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="rounded-lg bg-white p-4 text-center font-black text-navy shadow-sm"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {testimonialSection.enabled ? (
        <div>
          <SectionHeader title={testimonialSection.title} />
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-5 text-sm font-bold text-slate-500">
            Approved customer testimonials will appear here after review
            moderation is enabled.
          </div>
        </div>
      ) : null}
      {blogSection.enabled ? (
        <div>
          <SectionHeader
            title={blogSection.title}
            href={blogSection.link || "/blog"}
          />
          <div className="space-y-3">
            {blogPosts.length ? (
              blogPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block rounded-lg bg-white p-5 shadow-sm"
                >
                  <strong className="text-navy">{post.title}</strong>
                  <p className="mt-2 text-sm text-slate-500">{post.excerpt}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-5 text-sm font-bold text-slate-500">
                No published blog posts yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function AdminTable({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm">
      <h2 className="border-b border-[var(--border)] p-5 text-xl font-black text-navy">
        {title}
      </h2>
      <div className="table-wrap">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.join("-")}
                className="border-b border-[var(--border)] last:border-0"
              >
                {row.map((cell) => (
                  <td key={cell} className="min-w-32 p-4 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
