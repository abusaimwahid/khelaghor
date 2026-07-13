import { ProductGrid } from "@/components/sections";
import { listProducts, productToCard } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = slug.replaceAll("-", " ");
  const items = await listProducts({ brandSlug: slug });
  return <ProductGrid title={name.replace(/\b\w/g, (c) => c.toUpperCase())} items={items.map(productToCard)} eyebrow="Brand" />;
}
