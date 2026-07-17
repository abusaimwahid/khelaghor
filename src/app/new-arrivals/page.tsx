import { ProductGrid } from "@/components/sections";
import { listProducts, productToCard } from "@/server/catalog";
import { getHomepageSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [homepage, products] = await Promise.all([
    getHomepageSettings(),
    listProducts({ take: 24 }),
  ]);
  return (
    <ProductGrid
      title="New Arrivals"
      href="/shop"
      items={products.map(productToCard)}
      section={{ ...homepage.newArrivals, enabled: true }}
    />
  );
}
