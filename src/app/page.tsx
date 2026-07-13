import { CategoryGrid, ContentHighlights, DiscoveryRows, FlashSale, Hero, ProductGrid, PromoBands, TrustBadges } from "@/components/sections";
import { products } from "@/data/catalog";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <TrustBadges />
      <ProductGrid title="Trending Products" href="/shop" items={products.slice(0, 8)} />
      <FlashSale />
      <ProductGrid title="New Arrivals" href="/new-arrivals" items={products.slice(8, 16)} />
      <ProductGrid title="Best Sellers" href="/best-sellers" items={products.slice(16, 24)} />
      <DiscoveryRows />
      <PromoBands />
      <ContentHighlights />
    </>
  );
}
