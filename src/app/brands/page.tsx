import Link from "next/link";
import { listBrands } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await listBrands();
  return (
    <section className="container storefront-page">
      <div className="storefront-surface rounded-[var(--radius-hero)] bg-[var(--surface-lavender)] p-7 md:p-10">
        <p className="storefront-eyebrow">Play with confidence</p>
        <h1 className="storefront-title mt-2">Brands</h1>
        <p className="storefront-muted mt-3 max-w-2xl">Explore the makers behind our thoughtfully selected toys, books and family essentials.</p>
        <p className="mt-4 text-sm font-black text-teal">{brands.length} brands available</p>
      </div>
      {brands.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/brands/${brand.slug}`} className="flex min-h-32 items-center justify-center rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-6 text-center text-lg font-black text-navy shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
              <span>{brand.name}</span>
            </Link>
          ))}
        </div>
      ) : <div className="storefront-surface mt-8 p-10 text-center font-bold text-slate-500">No brands are available yet.</div>}
    </section>
  );
}
