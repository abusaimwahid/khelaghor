import { ProductGrid } from "@/components/sections";
import { listProducts, productToCard } from "@/server/catalog";
import { getHomepageSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [homepage, products] = await Promise.all([
    getHomepageSettings(),
    listProducts({ take: 24 }),
  ]);
  const cards = products
    .map(productToCard)
    .sort((a, b) => b.reviews - a.reviews || b.stock - a.stock);
  return (
    <ProductGrid
      title="Best Sellers"
      href="/shop"
      items={cards}
      section={{ ...homepage.bestSellers, enabled: true }}
    />
  );
}
