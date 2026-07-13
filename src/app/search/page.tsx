import { ProductGrid } from "@/components/sections";
import { listProducts, productToCard } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const filtered = await listProducts({ q, take: q ? undefined : 8 });
  return <ProductGrid title={q ? `Search results for “${q}”` : "Popular Searches"} items={filtered.map(productToCard)} eyebrow="Search" />;
}
