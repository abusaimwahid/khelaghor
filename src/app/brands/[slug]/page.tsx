import Link from "next/link";
import { ProductGrid } from "@/components/sections";
import { listProducts, productToCard } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = slug.replaceAll("-", " ");
  const items = await listProducts({ brandSlug: slug });
  const displayName = name.replace(/\b\w/g, (c) => c.toUpperCase());
  return <section className="container storefront-page">
    <nav className="storefront-breadcrumb mb-5"><Link href="/" className="hover:text-coral">Home</Link><span className="px-2">/</span><Link href="/brands" className="hover:text-coral">Brands</Link><span className="px-2">/</span><span className="text-navy">{displayName}</span></nav>
    <div className="storefront-surface rounded-[var(--radius-hero)] bg-[var(--surface-sky)] p-7 md:p-10"><p className="storefront-eyebrow">Brand collection</p><h1 className="storefront-title mt-2">{displayName}</h1><p className="storefront-muted mt-3 max-w-2xl">Discover products from {displayName}, selected for playful learning and everyday family life.</p><p className="mt-4 text-sm font-black text-teal">{items.length} products</p></div>
    <div className="mt-8"><ProductGrid title={`Shop ${displayName}`} items={items.map(productToCard)} /></div>
  </section>;
}
