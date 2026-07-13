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
import {
  blogPosts,
  brands,
  categories,
  orders,
  products,
} from "@/data/catalog";
import { money } from "@/lib/utils";
import type { CardProduct } from "./product-card";

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

export function Hero() {
  return (
    <section className="overflow-hidden bg-gradient-to-br from-cream via-white to-[#e8fbf7]">
      <div className="container grid min-h-[560px] items-center gap-10 py-12 md:grid-cols-2">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-sun/50 px-4 py-2 text-sm font-black text-navy">
            Bangladesh’s joyful kids store
          </p>
          <h1 className="max-w-xl text-4xl font-black leading-tight text-navy md:text-6xl">
            Play. Learn. Grow Together.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Safe toys, helpful books, newborn essentials and school-ready
            favourites selected for curious children and practical parents.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-md bg-coral px-6 py-3 font-black text-white shadow-lg shadow-coral/20"
            >
              Shop Now
            </Link>
            <Link
              href="/categories"
              className="rounded-md border border-[var(--border)] bg-white px-6 py-3 font-black text-navy"
            >
              Explore Categories
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] rounded-lg bg-white p-5 shadow-2xl">
            <div className="grid h-full grid-cols-2 gap-4">
              {products.slice(0, 4).map((product) => (
                <div key={product.id} className="rounded-lg bg-cream p-4">
                  <p className="text-sm font-black text-navy">{product.name}</p>
                  <p className="mt-2 text-2xl font-black text-coral">
                    {money(product.salePrice ?? product.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryGrid() {
  return (
    <section className="container py-12">
      <SectionHeader title="Shop By Category" href="/categories" />
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
              {category.children.join(" • ")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TrustBadges() {
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
  items = products.slice(0, 8),
  href,
  eyebrow,
}: {
  title: string;
  items?: CardProduct[];
  href?: string;
  eyebrow?: string;
}) {
  return (
    <section className="container py-12">
      <SectionHeader title={title} href={href} eyebrow={eyebrow} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 4}
          />
        ))}
      </div>
    </section>
  );
}

export function PromoBands() {
  const promos = [
    "Back to School",
    "Newborn Essentials",
    "Birthday Gifts",
    "Learning Toys",
  ];
  return (
    <section className="container grid gap-4 py-12 md:grid-cols-4">
      {promos.map((promo, index) => (
        <Link
          key={promo}
          href="/offers"
          className="rounded-lg bg-navy p-6 text-white shadow-sm"
        >
          <StatusBadge>{index % 2 ? "Featured" : "Sale"}</StatusBadge>
          <h3 className="mt-6 text-xl font-black">{promo}</h3>
          <p className="mt-2 text-sm text-white/70">
            Curated collections with Bangladesh-ready delivery.
          </p>
        </Link>
      ))}
    </section>
  );
}

export function DiscoveryRows() {
  return (
    <section className="container grid gap-8 py-12 lg:grid-cols-2">
      <div>
        <SectionHeader title="Shop By Age" />
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
      <div>
        <SectionHeader title="Shop By Gender" />
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
    </section>
  );
}

export function FlashSale() {
  return (
    <section className="bg-navy py-12 text-white">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-sun">
              Limited time
            </p>
            <h2 className="text-3xl font-black">Flash Sale</h2>
          </div>
          <div className="flex gap-2 font-black">
            <Clock /> 12h : 24m : 08s
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products
            .filter((p) => p.salePrice)
            .slice(0, 4)
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </div>
    </section>
  );
}

export function ContentHighlights() {
  return (
    <section className="container grid gap-8 py-12 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <SectionHeader title="Featured Brands" href="/brands" />
        <div className="grid grid-cols-2 gap-3">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={`/brands/${brand.toLowerCase().replaceAll(" ", "-")}`}
              className="rounded-lg bg-white p-4 text-center font-black text-navy shadow-sm"
            >
              {brand}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <SectionHeader title="Parent Reviews" />
        <div className="space-y-3">
          {[
            "Beautiful quality and fast Dhaka delivery.",
            "The educational toys feel thoughtfully selected.",
            "Checkout was simple and COD worked perfectly.",
          ].map((review) => (
            <blockquote
              key={review}
              className="rounded-lg bg-white p-5 text-slate-600 shadow-sm"
            >
              “{review}”
            </blockquote>
          ))}
        </div>
      </div>
      <div>
        <SectionHeader title="Recent Blog Posts" href="/blog" />
        <div className="space-y-3">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-lg bg-white p-5 shadow-sm"
            >
              <strong className="text-navy">{post.title}</strong>
              <p className="mt-2 text-sm text-slate-500">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminDashboard() {
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const stats = [
    ["Total revenue", money(revenue)],
    ["Total orders", String(orders.length)],
    [
      "Pending orders",
      String(orders.filter((o) => o.status === "Pending").length),
    ],
    [
      "Low stock products",
      String(products.filter((p) => p.stock > 0 && p.stock < 10).length),
    ],
    ["Out of stock", String(products.filter((p) => p.stock === 0).length)],
    ["Average order value", money(Math.round(revenue / orders.length))],
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <strong className="mt-2 block text-2xl text-navy">{value}</strong>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminTable
          title="Recent Orders"
          rows={orders.map((o) => [
            o.number,
            o.customer,
            money(o.total),
            o.status,
          ])}
        />
        <AdminTable
          title="Best Selling Products"
          rows={products
            .slice(0, 6)
            .map((p) => [p.sku, p.name, p.categoryName, String(p.stock)])}
        />
      </div>
    </div>
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
